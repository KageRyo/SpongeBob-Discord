from services.google_sheets_service import get_meme_urls


def search_memes(keyword, source):
    memes = get_meme_urls()
    results = [meme[source] for meme in memes if keyword in meme['keyword']]
    return results