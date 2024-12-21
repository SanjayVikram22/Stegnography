from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image
import numpy as np
import io
import os
from cryptography.fernet import Fernet, InvalidToken
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import cv2
import tempfile
import wave
import struct
from pydub import AudioSegment
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# -------------------- Utility Functions -------------------- #

def process_user_key(user_key, salt=None):
    """
    Process a user-provided key to make it compatible with Fernet using PBKDF2.

    Args:
        user_key (str): The user's secret key/password.
        salt (bytes, optional): Salt for key derivation. Generates a new one if None.

    Returns:
        tuple: (derived_key, salt)
    """
    if not salt:
        # Generate a random 16-byte salt if not provided
        salt = os.urandom(16)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),      # Use SHA256 for the hashing algorithm
        length=32,                      # Fernet requires a 32-byte key
        salt=salt,
        iterations=100_000,             # Number of iterations for key derivation
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(user_key.encode()))
    return key, salt

def encrypt_message(message, key):
    """
    Encrypt the message using Fernet symmetric encryption.

    Args:
        message (str): The plaintext message to encrypt.
        key (bytes): The derived Fernet key.

    Returns:
        bytes: The encrypted message.
    """
    fernet = Fernet(key)
    return fernet.encrypt(message.encode())

def decrypt_message(encrypted_message, key):
    """
    Decrypt the message using Fernet symmetric encryption.

    Args:
        encrypted_message (bytes): The encrypted message.
        key (bytes): The derived Fernet key.

    Returns:
        str: The decrypted plaintext message.
    """
    fernet = Fernet(key)
    return fernet.decrypt(encrypted_message).decode()

def text_to_binary(data):
    """
    Convert bytes data to a binary string.

    Args:
        data (bytes): The data to convert.

    Returns:
        str: The binary string representation.
    """
    return ''.join(format(byte, '08b') for byte in data)

def binary_to_text(binary_string):
    """
    Convert a binary string to bytes data.

    Args:
        binary_string (str): The binary string to convert.

    Returns:
        bytes: The resulting bytes data.
    """
    # Ensure the binary string length is a multiple of 8
    if len(binary_string) % 8 != 0:
        binary_string = binary_string[:-(len(binary_string) % 8)]

    chars = [binary_string[i:i+8] for i in range(0, len(binary_string), 8)]
    return bytes(int(char, 2) for char in chars)

def convert_to_wav(input_path, output_path):
    """
    Convert any supported audio format to WAV using pydub.

    Args:
        input_path (str): Path to the input audio file.
        output_path (str): Path to save the converted WAV file.
    """
    try:
        audio = AudioSegment.from_file(input_path)
        audio.export(output_path, format="wav")
        logging.info(f"Converted {input_path} to WAV format at {output_path}.")
    except Exception as e:
        raise ValueError(f"Error converting audio to WAV: {e}")

def encode_image(image, binary_data):
    """
    Encode binary data into an image using LSB steganography.

    Args:
        image (PIL.Image.Image): The image to encode data into.
        binary_data (str): The binary string to embed.

    Returns:
        PIL.Image.Image: The encoded image.
    """
    pixels = np.array(image.convert('RGB'))
    pixels_flat = pixels.flatten()
    text_index = 0

    if len(binary_data) > len(pixels_flat):
        raise ValueError("Binary data is too large to encode in this image.")

    for i in range(len(pixels_flat)):
        if text_index < len(binary_data):
            pixel = pixels_flat[i]
            new_pixel = (pixel & ~1) | int(binary_data[text_index])
            pixels_flat[i] = new_pixel
            text_index += 1
        else:
            break

    encoded_pixels = pixels_flat.reshape(pixels.shape)
    return Image.fromarray(encoded_pixels.astype('uint8'), 'RGB')

def decode_image(encoded_image, delimiter='10101010101010101010101010101010'):
    """
    Decode binary data from an image using LSB steganography.

    Args:
        encoded_image (PIL.Image.Image): The image to decode data from.
        delimiter (str): The unique bit sequence marking the end of data.

    Returns:
        str: The extracted binary string without the delimiter.

    Raises:
        ValueError: If the delimiter is not found in the encoded data.
    """
    pixels = np.array(encoded_image.convert('RGB'))
    pixels_flat = pixels.flatten()
    binary_data = ''

    for pixel in pixels_flat:
        binary_data += str(pixel & 1)
        if len(binary_data) >= len(delimiter):
            if binary_data[-len(delimiter):] == delimiter:
                logging.info("Delimiter found in image.")
                return binary_data[:-len(delimiter)]

    raise ValueError("End delimiter not found in the encoded image.")

def encode_video(video_path, binary_data, output_path):
    """
    Encode binary data into a video using LSB steganography across frames.

    Args:
        video_path (str): Path to the input video file.
        binary_data (str): The binary string to embed.
        output_path (str): Path to save the encoded video.

    Raises:
        ValueError: If the video file cannot be opened or codec is unsupported.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open the video file.")

    # Get video properties
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    # Use a lossless codec like 'MJPG' with minimal compression
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')  # 'MJPG' is relatively lossless

    out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

    if not out.isOpened():
        cap.release()
        raise ValueError("Cannot open the video writer with the specified codec. Ensure that 'MJPG' is installed or choose a different lossless codec.")

    data_index = 0
    total_data_length = len(binary_data)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Flatten the frame to iterate over pixels
        flat_frame = frame.flatten()

        for i in range(len(flat_frame)):
            if data_index < total_data_length:
                # Modify the LSB of each byte
                flat_frame[i] = (flat_frame[i] & ~1) | int(binary_data[data_index])
                data_index += 1
            else:
                break

        # Reshape and write the modified frame
        modified_frame = flat_frame.reshape((frame_height, frame_width, 3))
        out.write(modified_frame.astype('uint8'))

        if data_index >= total_data_length:
            # Write the remaining frames without modification
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                out.write(frame)
            break

    cap.release()
    out.release()
    logging.info(f"Video encoded successfully at {output_path}.")

def decode_video(video_path, delimiter='10101010101010101010101010101010', max_bits=1_000_000):
    """
    Decode binary data from a video using LSB steganography across frames.

    Args:
        video_path (str): Path to the encoded video file.
        delimiter (str): The unique bit sequence marking the end of data.
        max_bits (int): Maximum number of bits to read to prevent excessive processing.

    Returns:
        str: The extracted binary string without the delimiter.

    Raises:
        ValueError: If the delimiter is not found within the maximum bit limit.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Cannot open the video file.")

    binary_data = ''

    while cap.isOpened() and len(binary_data) < max_bits:
        ret, frame = cap.read()
        if not ret:
            break

        # Flatten the frame to iterate over pixels
        flat_frame = frame.flatten()

        for pixel in flat_frame:
            binary_data += str(pixel & 1)
            # Check for delimiter
            if len(binary_data) >= len(delimiter):
                if binary_data[-len(delimiter):] == delimiter:
                    logging.info("Delimiter found in video.")
                    cap.release()
                    return binary_data[:-len(delimiter)]  # Exclude delimiter

    cap.release()
    raise ValueError("End delimiter not found in the encoded video.")

def encode_audio(audio_path, binary_data, output_path):
    """
    Encode binary data into an audio file using LSB steganography.

    Args:
        audio_path (str): Path to the input audio file (any format).
        binary_data (str): Binary string to embed.
        output_path (str): Path to save the encoded audio file (WAV).

    Raises:
        ValueError: If binary data exceeds audio capacity.
    """
    # Convert input audio to WAV
    temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
    convert_to_wav(audio_path, temp_wav)

    with wave.open(temp_wav, 'rb') as audio:
        params = audio.getparams()
        n_channels, sampwidth, framerate, n_frames, comptype, compname = params
        frames = audio.readframes(n_frames)

    # Convert frames to a mutable bytearray
    frame_bytes = bytearray(frames)

    # Check if the audio has enough capacity
    total_available_bits = len(frame_bytes)
    if len(binary_data) > total_available_bits:
        os.remove(temp_wav)
        raise ValueError("Binary data is too large to encode in this audio file.")

    # Embed the binary data into LSBs
    for i in range(len(binary_data)):
        frame_bytes[i] = (frame_bytes[i] & 254) | int(binary_data[i])

    # Write the modified frames to the output WAV file
    with wave.open(output_path, 'wb') as encoded_audio:
        encoded_audio.setparams(params)
        encoded_audio.writeframes(frame_bytes)

    # Clean up temporary WAV file
    os.remove(temp_wav)
    logging.info(f"Audio encoded successfully at {output_path}.")

def decode_audio(audio_path, delimiter='10101010101010101010101010101010', max_bits=1_000_000):
    """
    Decode binary data from an audio file using LSB steganography.

    Args:
        audio_path (str): Path to the encoded audio file (any format).
        delimiter (str): The unique bit sequence marking the end of data.
        max_bits (int): Maximum number of bits to read to prevent excessive processing.

    Returns:
        str: The extracted binary string without the delimiter.

    Raises:
        ValueError: If delimiter is not found within the maximum bit limit.
    """
    # Convert input audio to WAV
    temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
    convert_to_wav(audio_path, temp_wav)

    with wave.open(temp_wav, 'rb') as audio:
        frames = audio.readframes(audio.getnframes())

    frame_bytes = bytearray(frames)
    binary_data = ''

    for byte in frame_bytes:
        binary_data += str(byte & 1)
        if len(binary_data) >= len(delimiter):
            if binary_data[-len(delimiter):] == delimiter:
                logging.info("Delimiter found in audio.")
                os.remove(temp_wav)
                return binary_data[:-len(delimiter)]  # Exclude delimiter
        if len(binary_data) >= max_bits:
            break

    os.remove(temp_wav)
    raise ValueError("End delimiter not found in the encoded audio.")

# -------------------- Image Encode Endpoint -------------------- #

@app.route('/encode', methods=['POST'])
def encode_image_endpoint():
    """
    Endpoint to encode a secret message into an image.

    Expects:
        - image (file): The image file to embed data into.
        - text (str): The secret message to embed.
        - key (str): The secret key/password for encryption.

    Returns:
        - Encoded image file for download.
    """
    try:
        # Ensure all required data is present
        if 'image' not in request.files:
            return jsonify({"error": "Image file not provided"}), 400
        if 'text' not in request.form:
            return jsonify({"error": "Text message not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        # Get image, text, and user-provided key from the request
        image_file = request.files['image']
        text = request.form['text']
        user_key = request.form['key']

        # Process the user-provided key to ensure it's compatible with Fernet
        fernet_key, salt = process_user_key(user_key)

        # Encrypt the message using the processed key
        encrypted_message = encrypt_message(text, fernet_key)

        # Prepend salt to encrypted message
        salted_encrypted_message = salt + encrypted_message

        # Convert to binary
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        binary_data = text_to_binary(salted_encrypted_message) + delimiter  # Delimiter

        # Log the last bits to confirm delimiter
        if not binary_data.endswith(delimiter):
            raise ValueError("Delimiter not correctly appended to binary data.")
        logging.info(f"Delimiter appended correctly: {binary_data.endswith(delimiter)}")

        # Log lengths
        logging.info(f"Salt length: {len(salt)} bytes")
        logging.info(f"Encrypted message length: {len(encrypted_message)} bytes")
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Encode the message into the image
        image = Image.open(image_file.stream)
        encoded_image = encode_image(image, binary_data)

        # Prepare image for output
        output = io.BytesIO()
        encoded_image.save(output, format="PNG")
        output.seek(0)

        logging.info("Image encoding successful.")
        return send_file(output, mimetype='image/png', as_attachment=True, download_name="encoded_image.png")

    except Exception as e:
        logging.error(f"Image Encoding error: {e}")
        return jsonify({"error": f"Error encoding the image: {str(e)}"}), 400

# -------------------- Image Decode Endpoint -------------------- #

@app.route('/decode', methods=['POST'])
def decode_image_endpoint():
    """
    Endpoint to decode a secret message from an encoded image.

    Expects:
        - image (file): The encoded image file.
        - key (str): The secret key/password used during encoding.

    Returns:
        - JSON containing the hidden message.
    """
    try:
        # Get image and the user-provided key from the request
        if 'image' not in request.files:
            return jsonify({"error": "Encoded image file not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        image_file = request.files['image']
        user_key = request.form['key']

        # Decode binary data from the image
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        encoded_image = Image.open(image_file.stream)
        binary_data = decode_image(encoded_image, delimiter=delimiter)

        # Log length
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Convert binary data back to bytes
        salted_encrypted_message = binary_to_text(binary_data)

        # Log length
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")

        # Extract salt and encrypted message
        if len(salted_encrypted_message) < 16:
            raise ValueError("Insufficient data to extract salt.")

        salt = salted_encrypted_message[:16]
        encrypted_message = salted_encrypted_message[16:]

        # Re-derive the key using the extracted salt
        fernet_key, _ = process_user_key(user_key, salt)

        # Decrypt the message
        hidden_message = decrypt_message(encrypted_message, fernet_key)

        logging.info("Image decoding successful.")
        return jsonify({"hidden_message": hidden_message})

    except InvalidToken:
        logging.error("InvalidToken: Incorrect key or corrupted data.")
        return jsonify({"error": "Invalid key or corrupted data."}), 400
    except Exception as e:
        logging.error(f"Image Decoding error: {e}")  # Log specific error details
        return jsonify({"error": f"Failed to decode the image: {str(e)}"}), 400

# -------------------- Video Encode Endpoint -------------------- #

@app.route('/encode_video', methods=['POST'])
def encode_video_endpoint():
    """
    Endpoint to encode a secret message into a video.

    Expects:
        - video (file): The video file to embed data into.
        - text (str): The secret message to embed.
        - key (str): The secret key/password for encryption.

    Returns:
        - Encoded video file for download.
    """
    try:
        # Ensure all required data is present
        if 'video' not in request.files:
            return jsonify({"error": "Video file not provided"}), 400
        if 'text' not in request.form:
            return jsonify({"error": "Text message not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        # Get video, text, and user-provided key from the request
        video_file = request.files['video']
        text = request.form['text']
        user_key = request.form['key']

        # Validate video file extension
        ALLOWED_VIDEO_EXTENSIONS = {'avi', 'mp4', 'mov', 'mkv'}
        if '.' not in video_file.filename or \
           video_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_VIDEO_EXTENSIONS:
            return jsonify({"error": "Unsupported video file type"}), 400

        # Process the user-provided key to ensure it's compatible with Fernet
        fernet_key, salt = process_user_key(user_key)

        # Encrypt the message using the processed key
        encrypted_message = encrypt_message(text, fernet_key)

        # Prepend salt to encrypted message
        salted_encrypted_message = salt + encrypted_message

        # Convert to binary
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        binary_data = text_to_binary(salted_encrypted_message) + delimiter  # Delimiter

        # Log the last bits to confirm delimiter
        if not binary_data.endswith(delimiter):
            raise ValueError("Delimiter not correctly appended to binary data.")
        logging.info(f"Delimiter appended correctly: {binary_data.endswith(delimiter)}")

        # Log lengths
        logging.info(f"Salt length: {len(salt)} bytes")
        logging.info(f"Encrypted message length: {len(encrypted_message)} bytes")
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Save the uploaded video to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(video_file.filename)[1]) as temp_input:
            video_file.save(temp_input.name)
            input_video_path = temp_input.name

        # Check video capacity
        cap = cv2.VideoCapture(input_video_path)
        if not cap.isOpened():
            os.remove(input_video_path)
            raise ValueError("Cannot open the video file for capacity check.")

        total_available_bits = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) * \
                               int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) * \
                               int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) * 3  # RGB channels
        cap.release()

        required_bits = len(binary_data)
        if required_bits > total_available_bits:
            os.remove(input_video_path)
            return jsonify({"error": "Binary data is too large to encode in this video."}), 400

        # Prepare output video path
        with tempfile.NamedTemporaryFile(delete=False, suffix='.avi') as temp_output:
            output_video_path = temp_output.name

        # Encode the binary data into the video
        encode_video(input_video_path, binary_data, output_video_path)

        # Remove the input temporary file
        os.remove(input_video_path)

        # Prepare video for output
        logging.info("Video encoding successful.")
        return send_file(output_video_path, mimetype='video/x-msvideo', as_attachment=True, download_name="encoded_video.avi")

    except Exception as e:
        logging.error(f"Video Encoding error: {e}")
        return jsonify({"error": f"Error encoding the video: {str(e)}"}), 400

# -------------------- Video Decode Endpoint -------------------- #

@app.route('/decode_video', methods=['POST'])
def decode_video_endpoint():
    """
    Endpoint to decode a secret message from an encoded video.

    Expects:
        - video (file): The encoded video file.
        - key (str): The secret key/password used during encoding.

    Returns:
        - JSON containing the hidden message.
    """
    try:
        # Ensure all required data is present
        if 'video' not in request.files:
            return jsonify({"error": "Encoded video file not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        # Get video and user-provided key from the request
        video_file = request.files['video']
        user_key = request.form['key']

        # Validate video file extension
        ALLOWED_VIDEO_EXTENSIONS = {'avi', 'mp4', 'mov', 'mkv'}
        if '.' not in video_file.filename or \
           video_file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_VIDEO_EXTENSIONS:
            return jsonify({"error": "Unsupported video file type"}), 400

        # Save the uploaded video to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(video_file.filename)[1]) as temp_input:
            video_file.save(temp_input.name)
            input_video_path = temp_input.name

        # Decode binary data from the video
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        binary_data = decode_video(input_video_path, delimiter=delimiter)

        # Remove the input temporary file
        os.remove(input_video_path)

        # Log lengths
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Convert binary data back to bytes
        salted_encrypted_message = binary_to_text(binary_data)

        # Log length
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")

        # Extract salt and encrypted message
        if len(salted_encrypted_message) < 16:
            raise ValueError("Insufficient data to extract salt.")

        salt = salted_encrypted_message[:16]
        encrypted_message = salted_encrypted_message[16:]

        # Re-derive the key using the extracted salt
        fernet_key, _ = process_user_key(user_key, salt)

        # Decrypt the message
        hidden_message = decrypt_message(encrypted_message, fernet_key)

        logging.info("Video decoding successful.")
        return jsonify({"hidden_message": hidden_message})

    except InvalidToken:
        logging.error("InvalidToken: Incorrect key or corrupted data.")
        return jsonify({"error": "Invalid key or corrupted data."}), 400
    except Exception as e:
        logging.error(f"Video Decoding error: {e}")  # Log specific error details
        return jsonify({"error": f"Failed to decode the video: {str(e)}"}), 400

# -------------------- Audio Encode Endpoint -------------------- #

@app.route('/encode_audio', methods=['POST'])
def encode_audio_endpoint():
    """
    Endpoint to encode a secret message into an audio file.

    Expects:
        - audio (file): The audio file to embed data into (any format).
        - text (str): The secret message to embed.
        - key (str): The secret key/password for encryption.

    Returns:
        - Encoded audio file for download (WAV format).
    """
    try:
        # Ensure all required data is present
        if 'audio' not in request.files:
            return jsonify({"error": "Audio file not provided"}), 400
        if 'text' not in request.form:
            return jsonify({"error": "Text message not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        # Get audio, text, and user-provided key from the request
        audio_file = request.files['audio']
        text = request.form['text']
        user_key = request.form['key']

        # Process the user-provided key to ensure it's compatible with Fernet
        fernet_key, salt = process_user_key(user_key)

        # Encrypt the message using the processed key
        encrypted_message = encrypt_message(text, fernet_key)

        # Prepend salt to encrypted message
        salted_encrypted_message = salt + encrypted_message

        # Convert to binary
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        binary_data = text_to_binary(salted_encrypted_message) + delimiter  # Delimiter

        # Log the last bits to confirm delimiter
        if not binary_data.endswith(delimiter):
            raise ValueError("Delimiter not correctly appended to binary data.")
        logging.info(f"Delimiter appended correctly: {binary_data.endswith(delimiter)}")

        # Log lengths
        logging.info(f"Salt length: {len(salt)} bytes")
        logging.info(f"Encrypted message length: {len(encrypted_message)} bytes")
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Save the uploaded audio to a temporary file
        original_extension = os.path.splitext(audio_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_extension) as temp_input:
            audio_file.save(temp_input.name)
            input_audio_path = temp_input.name

        # Prepare output audio path
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_output:
            output_audio_path = temp_output.name

        # Encode the binary data into the audio
        encode_audio(input_audio_path, binary_data, output_audio_path)

        # Remove the input temporary file
        os.remove(input_audio_path)

        # Prepare audio for output
        logging.info("Audio encoding successful.")
        return send_file(output_audio_path, mimetype='audio/wav', as_attachment=True, download_name="encoded_audio.wav")

    except Exception as e:
        logging.error(f"Audio Encoding error: {e}")
        return jsonify({"error": f"Error encoding the audio: {str(e)}"}), 400

# -------------------- Audio Decode Endpoint -------------------- #

@app.route('/decode_audio', methods=['POST'])
def decode_audio_endpoint():
    """
    Endpoint to decode a secret message from an encoded audio file.

    Expects:
        - audio (file): The encoded audio file (any format).
        - key (str): The secret key/password used during encoding.

    Returns:
        - JSON containing the hidden message.
    """
    try:
        # Get audio and the user-provided key from the request
        if 'audio' not in request.files:
            return jsonify({"error": "Encoded audio file not provided"}), 400
        if 'key' not in request.form:
            return jsonify({"error": "Secret key not provided"}), 400

        audio_file = request.files['audio']
        user_key = request.form['key']

        # Save the uploaded audio to a temporary file
        original_extension = os.path.splitext(audio_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=original_extension) as temp_input:
            audio_file.save(temp_input.name)
            input_audio_path = temp_input.name

        # Decode binary data from the audio
        delimiter = '10101010101010101010101010101010'  # 32-bit delimiter
        binary_data = decode_audio(input_audio_path, delimiter=delimiter)

        # Remove the input temporary file
        os.remove(input_audio_path)

        # Log lengths
        logging.info(f"Binary data length: {len(binary_data)} bits")

        # Convert binary data back to bytes
        salted_encrypted_message = binary_to_text(binary_data)

        # Log length
        logging.info(f"Salted encrypted message length: {len(salted_encrypted_message)} bytes")

        # Extract salt and encrypted message
        if len(salted_encrypted_message) < 16:
            raise ValueError("Insufficient data to extract salt.")

        salt = salted_encrypted_message[:16]
        encrypted_message = salted_encrypted_message[16:]

        # Re-derive the key using the extracted salt
        fernet_key, _ = process_user_key(user_key, salt)

        # Decrypt the message
        hidden_message = decrypt_message(encrypted_message, fernet_key)

        logging.info("Audio decoding successful.")
        return jsonify({"hidden_message": hidden_message})

    except InvalidToken:
        logging.error("InvalidToken: Incorrect key or corrupted data.")
        return jsonify({"error": "Invalid key or corrupted data."}), 400
    except Exception as e:
        logging.error(f"Audio Decoding error: {e}")  # Log specific error details
        return jsonify({"error": f"Failed to decode the audio: {str(e)}"}), 400

# -------------------- Main Block -------------------- #

if __name__ == '__main__':
    # Run the Flask application
    # For production, consider using a production-ready server like Gunicorn
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
    # app.run(debug=True)  # Uncomment for development
