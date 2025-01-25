from discord.ext import commands
from discord import app_commands

class Setting(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="set_source")
    async def set_source(self, interaction, source: str):
        """Set the default source for memes."""
        # TODO: Implement setting source logic
        await interaction.response.send_message(f"Source set to {source}")

async def setup(bot):
    bot.tree.add_command(Setting(bot).set_source)