import os
import subprocess

# Paths
audio_folder = "static/audio"
output_folder = "static/lipsync"
rhubarb_path = "../rhubarb"  # relative to project folder

# Ensure output folder exists
os.makedirs(output_folder, exist_ok=True)

# Loop through all .wav files
for filename in os.listdir(audio_folder):
    if filename.endswith(".wav"):
        input_path = os.path.join(audio_folder, filename)
        output_filename = os.path.splitext(filename)[0] + ".json"
        output_path = os.path.join(output_folder, output_filename)

        print(f"Generating lip sync for: {filename}")
        subprocess.run([
            rhubarb_path,
            input_path,
            "-o", output_path,
            "-f", "json"
        ])
