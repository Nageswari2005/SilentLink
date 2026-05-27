import subprocess
import webbrowser
import sys

class AppLauncher:
    def launch(self, app_name: str):
        print(f"Launching {app_name}...")
        try:
            if app_name.lower() == "whatsapp":
                if sys.platform == "win32":
                    subprocess.run(["cmd", "/c", "start", "whatsapp://"], shell=True)
                else:
                    webbrowser.open("https://web.whatsapp.com")
            elif app_name.lower() == "youtube":
                webbrowser.open("https://www.youtube.com")
            elif app_name.lower() == "browser":
                webbrowser.open("https://www.google.com")
            return f"Opened {app_name}"
        except Exception as e:
            print(f"Failed to launch {app_name}: {e}")
            return f"Failed to open {app_name}"
