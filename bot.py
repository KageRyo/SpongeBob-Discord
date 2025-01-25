import discord
from discord.ext import commands
from loguru import logger
from env import discord_bot_token

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

@bot.event
async def on_ready():
    logger.info(f'We have logged in as {bot.user}')

@bot.command()
async def hello(ctx):
    await ctx.send('Hello!')

if __name__ == "__main__":
    if discord_bot_token:
        bot.run(discord_bot_token)
    else:
        logger.error("Discord bot token not found. Please check your environment variables.")