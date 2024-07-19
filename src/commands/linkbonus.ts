import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, te } from '../library/functions';
import { BASE_WIKI } from '..';

export default class LinkBonusCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'linkbonus',
      description: "Search unit's link bonuses",
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'unit',
          description: 'The unit to search link bonuses for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['unit'];
    if (!text) return 'No unit name';
    let unit = nameChange(text);
    const link = `${BASE_WIKI}/wiki/${encodeURI(unit)}`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      if ($(".unitname").html()) { unit = te($(".unitname").html()) }
				var l1 = te($('.linktable1').html())
				var l2 = te($('.linktable2').html())
				if (l1) {
          let embed: MessageEmbedOptions = {
            title: unit,
            url: link,
            fields: [
              {
                name: 'Bonus per Link (Max 5)',
                value: l1,
                inline: true
              },
              {
                name: 'Full Link Bonus (Choose 1)',
                value: l2,
                inline: true
              }
            ]
          };
					ctx.send({embeds: [embed]})
				}
      else {
        return ctx.send("Can't find anything");
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}
