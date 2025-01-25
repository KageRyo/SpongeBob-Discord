from discord import Interaction
from discord.ext import commands


async def hello(interaction: Interaction):
    await interaction.response.send_message('Hello!')


def setup(bot: commands.Bot):
    bot.tree.command(name="hello")(hello)