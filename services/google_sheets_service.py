import gspread
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), 'env', 'local.env'))

def get_meme_urls():
    gc = gspread.Client(auth=None)
    sh = gc.open_by_url(os.getenv('SOURCE'))
    worksheet = sh.worksheet(os.getenv('SHEET'))
    return worksheet.get_all_records()