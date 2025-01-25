from discord import Interaction
from discord.ext import commands
from discord import app_commands
from services.google_sheets_service import get_meme_urls
from utils.meme_utils import search_memes

class Search(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="search")
    async def search(self, interaction: Interaction, keyword: str, source: str):
        """Search for a meme by keyword and source."""
        memes = search_memes(keyword, source)
        if not memes:
            await interaction.response.send_message("No memes found.")
            return

        # If multiple memes found, show selection buttons
        if len(memes) > 1:
            # TODO: Implement selection buttons
            await interaction.response.send_message("Multiple memes found. Please select one.")
        else:
            await interaction.response.send_message(memes[0])

async def setup(bot):
    bot.tree.add_command(Search(bot).search)