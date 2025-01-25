import os
from dotenv import load_dotenv

# Load environment variables from the specified .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'env', 'local.env'))

# Retrieve the Discord bot token and Google Sheets info from the environment variables
discord_bot_token = os.getenv('DISCORD_BOT_TOKEN')
google_sheets_url = os.getenv('SOURCE')
google_sheets_sheet = os.getenv('SHEET')