import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { restoreImageLink, sendPages, te } from '../library/functions';
import {name as name2} from '../library/name'
import {equip as name3} from '../library/equip'
import { BASE_WIKI } from '..';

export default class EquipmentCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'equipment',
      description: 'Search equipment info',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'equipment',
          description: 'The equipment to search for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['equipment'];
    if (!text) return 'No equipment name';
    if (text.length < 3) return 'Search term too short!';
    var gear = text.toLowerCase();
    gear = nameChange(gear);
    gear = gear.toLowerCase();
    var many = false;
    const link = `${BASE_WIKI}/wiki/Equipment_List`;
    try {
      var check = false;
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      var pages: MessageEmbedOptions[] = [];
      $('.wikitable tbody tr').each(function (i, elem) {
        if (many) return;
        let tags = $(this).children().eq(1).find('a');
        let note = $(this).children().eq(3).text();
        note = te(note);
        if (tags.length > 0) {
          let name = tags.eq(0).html();
          name = te(name);
          if (name) {
            if (rankRemove(name.toLowerCase()).includes(gear) || (note != null && (note.toLowerCase().includes(`${gear}'s exclusive`) || note.toLowerCase().includes(`${gear} exclusive`)))) {
              check = true;
              let img = $(this).children().eq(0).find('a').find('img').eq(0).attr('data-src');
              if (!img) {
                img = $(this).children().eq(0).find('a').find('img').eq(0).attr('src');
              }
              img = restoreImageLink(img);
              let eff = $(this).children().eq(2).html();
              eff = te(eff);

              let exp = $(this).children().eq(4).text();
              exp = te(exp);
              let link2 = `${BASE_WIKI}/wiki/${encodeURI(name)}`;
              let embed: MessageEmbedOptions = {
                title: name,
                url: link2,
                image: { url: img },
                fields: [
                  {
                    name: 'Effect',
                    value: eff
                  }
                ]
              };
              if (note) {
                embed.fields.push({
                  name: 'Note',
                  value: note
                });
              }
              if (exp) {
                embed.fields.push({
                  name: 'EXP to Max',
                  value: exp
                });
              }
              pages.push(embed);
              if (pages.length > 5) {
                ctx.send("Too many matches");
                many = true;
                return;
              }
            }
          }
        }
      });
      if (many) return;
      if (pages.length > 0) {
        sendPages(ctx, pages);
      } else {
        ctx.send("Can't find anything");
      }
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}

function nameChange(unit: string) {
  let unit2 = unit.toLowerCase();
  if (name3[unit2]) {
    unit2 = name3[unit2];
  }
  unit2 = unit2.toLowerCase();
  if (name2[unit2]) {
    unit2 = name2[unit2];
  }
  return unit2;
}
function rankRemove(unit: string) {
  var unit2 = unit;
  var li = unit.split(' ');
  if (
    li.length > 1 &&
    (li[li.length - 1] == 'b' ||
      li[li.length - 1] == 'a' ||
      li[li.length - 1] == 's' ||
      li[li.length - 1] == 'ss' ||
      li[li.length - 1] == 'sss')
  ) {
    li.pop();
    unit2 = li.join(' ');
  }
  return unit2;
}
