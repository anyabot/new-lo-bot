import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, sendPages } from '../library/functions';
import { BASE_WIKI } from '..';

export default class DropCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'drop',
      description: "Search unit's or equipment's drop location",
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'key',
          description: 'The unit or equipment to search for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['key'];
    if (!text) return 'No unit name';
    const unit = nameChange(text);
    const link = `${BASE_WIKI}/wiki/${encodeURI(unit)}`;
    try {
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      var character = $('.catlinks').text().includes('Characters');
      var equipment = $('.catlinks').text().includes('Equipment');
      let check = false;
      if (!character && !equipment) ctx.send('Not Units / Equipment');
      else {
        var td_list = $('.wikitable.mw-collapsible tbody').children();
        let embed: MessageEmbedOptions = {
          title: unit,
          url: link,
          fields: []
        };
        if (td_list.length > 0) {
          if (td_list.eq(0).text().includes('Drop List')) {
            var temp: string[];
            var event: string;
            var stages: string[] = [];
            var stage: string;
            var note: string;
            for (var i = 2; i < td_list.length; i++) {
              temp = td_list.eq(i).text().split('\n\n');
              if (temp.length == 3) {
                if (stages.length > 0) {
                  embed.fields.push({
                    name: event,
                    value: stages.join(', '),
                    inline: true
                  });
                  check = true;
                }
                stages = [];
                event = temp[0].trim();
                stage = temp[1].trim();
                note = temp[2].trim();
                if (note.length > 0) {
                  stages.push(stage + ' (' + note + ')');
                } else stages.push(stage);
              } else if (temp.length == 2) {
                stage = temp[0].trim();
                note = temp[1].trim();
                if (note.length > 0) {
                  stages.push(stage + ' (' + note + ')');
                } else stages.push(stage);
              }
            }
            if (stages.length > 0) {
              embed.fields.push({
                name: event,
                value: stages.join(', '),
                inline: true
              });
              check = true;
            }
            if (check) {
              ctx.send({ embeds: [embed] });
            } else ctx.send('No Drop Location');
          } else ctx.send('No Drop Location');
        } else ctx.send('No Drop Location');
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}
