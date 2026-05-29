import { SlashCommand, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { BASE_WIKI } from '..';

export default class HelpCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'help',
      description: 'Show all available commands'
    });
  }

  async run(ctx: CommandContext) {
    const embed: MessageEmbedOptions = {
      title: 'Last Origin Bot Commands',
      url: BASE_WIKI,
      fields: [
        {
          name: '/search `key`',
          value: 'Search the wiki for any keyword. Returns up to 6 matching page links.'
        },
        {
          name: '/skill `unit`',
          value: 'Show a unit\'s skills (Active 1/2, Passive 1/2/3) with effects, range, and AoE.'
        },
        {
          name: '/equipment `equipment`',
          value: 'Show equipment stats, effect, note, and resource cost.'
        },
        {
          name: '/image `unit`',
          value: 'Show a unit\'s skins grouped by skin and normal/damaged.'
        },
        {
          name: '/drop `unit or equipment`',
          value: 'Show drop locations for a unit or equipment.'
        },
        {
          name: '/linkbonus `unit`',
          value: 'Show a unit\'s link bonus stats.'
        },
        {
          name: '/craftingtime `unit or time`',
          value: 'Look up a unit by crafting time, or look up crafting time by unit name. Example: `4:10:00` or `Express`.'
        },
        {
          name: '/arca `event`',
          value: 'Get the Arca forum page link for an event. Example: `st.orca\'s secret operation`.'
        },
        {
          name: '/apk',
          value: 'Get the latest Korean uncensored APK download link.'
        }
      ]
    };

    await ctx.send({ embeds: [embed] });
  }
}
