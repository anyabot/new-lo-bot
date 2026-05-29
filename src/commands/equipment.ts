import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { restoreImageLink, sendPages, te, wikiSearch } from '../library/functions';
import { name as name2 } from '../library/name';
import { equip as name3 } from '../library/equip';
import { BASE_WIKI } from '..';

function nameChange(unit: string) {
  let unit2 = unit.toLowerCase();
  if (name3[unit2]) unit2 = name3[unit2];
  unit2 = unit2.toLowerCase();
  if (name2[unit2]) unit2 = name2[unit2];
  return unit2;
}

function rankRemove(unit: string) {
  const li = unit.split(' ');
  if (li.length > 1 && ['b', 'a', 's', 'ss', 'sss'].includes(li[li.length - 1])) {
    li.pop();
    return li.join(' ');
  }
  return unit;
}

function scanEquipList($: any, gear: string): { pages: MessageEmbedOptions[]; tooMany: boolean } {
  const pages: MessageEmbedOptions[] = [];
  let tooMany = false;

  $('.wikitable tbody tr').each(function (_, elem) {
    if (tooMany) return;
    const tags = $(elem).children().eq(1).find('a');
    let note = $(elem).children().eq(3).text();
    note = te(note);
    if (tags.length > 0) {
      let ename = te(tags.eq(0).html());
      if (ename) {
        if (
          rankRemove(ename.toLowerCase()) === gear ||
          (note != null && (
            note.toLowerCase().includes(`${gear}'s exclusive`) ||
            note.toLowerCase().includes(`${gear} exclusive`)
          ))
        ) {
          let img = $(elem).children().eq(0).find('a').find('img').eq(0).attr('data-src');
          if (!img) img = $(elem).children().eq(0).find('a').find('img').eq(0).attr('src');
          img = restoreImageLink(img);
          let eff = te($(elem).children().eq(2).html());
          let exp = te($(elem).children().eq(4).text());
          const link2 = `${BASE_WIKI}/wiki/${encodeURI(ename)}`;
          const embed: MessageEmbedOptions = {
            title: ename,
            url: link2,
            image: { url: img },
            fields: [{ name: 'Effect', value: eff }]
          };
          if (note) embed.fields.push({ name: 'Note', value: note });
          if (exp) embed.fields.push({ name: 'Resources Cost', value: exp });
          pages.push(embed);
          if (pages.length > 5) { tooMany = true; return; }
        }
      }
    }
  });

  return { pages, tooMany };
}

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

    const gear = rankRemove(nameChange(text).toLowerCase());

    try {
      const res = await fetch(`${BASE_WIKI}/wiki/Equipment_List`, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);

      let { pages, tooMany } = scanEquipList($, gear);
      console.log(`[equipment] gear="${gear}": pages=${pages.length}, tooMany=${tooMany}`);

      if (tooMany) return await ctx.send('Too many matches');

      let fallbackTitle: string | null = null;
      if (pages.length === 0) {
        const searchResults = await wikiSearch(text);
        for (const title of searchResults) {
          if (pages.length > 0) break;
          const fallbackGear = rankRemove(nameChange(title).toLowerCase());
          if (fallbackGear === gear) continue;
          const result = scanEquipList($, fallbackGear);
          console.log(`[equipment] fallback "${fallbackGear}" (from "${title}"): pages=${result.pages.length}`);
          if (result.tooMany) return ctx.send('Too many matches');
          if (result.pages.length > 0) { pages = result.pages; fallbackTitle = title; }
        }
      }

      if (pages.length === 0) return await ctx.send("Can't find anything");
      if (fallbackTitle) await ctx.send(`_No exact match found. Showing results for **${fallbackTitle}**:_`);
      sendPages(ctx, pages);
    } catch (err) {
      await ctx.send("Can't find anything");
      console.log(err);
    }
  }
}
