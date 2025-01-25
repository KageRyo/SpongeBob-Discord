import asyncio
import discord
from discord.ext import commands
from loguru import logger
from env import discord_bot_token
from command import example, search, setting

async def create_bot():
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(command_prefix='!', intents=intents)
    example.setup(bot)
    await search.setup(bot)
    await setting.setup(bot)

    @bot.event
    async def on_ready():
        logger.info(f'We have logged in as {bot.user}')
        await sync_commands(bot)

    return bot

async def sync_commands(bot):
    try:
        synced = await bot.tree.sync()
        logger.info(f'Synced {len(synced)} command(s)')
    except Exception as e:
        logger.error(f'Failed to sync commands: {e}')

if __name__ == "__main__":
    bot = asyncio.run(create_bot())
    if discord_bot_token:
        bot.run(discord_bot_token)
    else:
        logger.error("Discord bot token not found. Please check your environment variables.")