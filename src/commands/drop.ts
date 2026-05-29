import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, sendPages, wikiSearch } from '../library/functions';
import { BASE_WIKI } from '..';

type DropResult =
  | { type: 'found'; pages: MessageEmbedOptions[] }
  | { type: 'msg'; msg: string }
  | { type: 'notfound' };

async function fetchDropData(pageTitle: string): Promise<DropResult> {
  const link = `${BASE_WIKI}/wiki/${encodeURI(pageTitle)}`;
  const res = await fetch(link, { method: 'GET' });
  const body = await res.text();
  const $ = load(body);

  const catText = $('.catlinks').text();
  const isCharacter = catText.includes('Characters');
  const isEquipment = catText.includes('Equipment');
  console.log(`[drop] "${pageTitle}": isCharacter=${isCharacter}, isEquipment=${isEquipment}`);
  if (!isCharacter && !isEquipment) return { type: 'notfound' };
  if (isCharacter && catText.includes('B-Rank')) return { type: 'msg', msg: 'B-Rank units are not listed in the wiki drop table.' };

  const embed: MessageEmbedOptions = { title: pageTitle, url: link, fields: [] };
  if (isEquipment) embed.description = 'Only SS rank drop locations are listed.';

  const cellWithLink = (cell: any): string => {
    const text = $(cell).text().trim();
    if (!text) return '';
    const href = $(cell).find('a').first().attr('href');
    return href ? `[${text}](${BASE_WIKI}${href})` : text;
  };

  const acquisitionItems = $('#Acquisition').parent().next('ul')
    .children('li').map((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).find('a').first().attr('href');
      return href ? `[${text}](${BASE_WIKI}${href})` : text;
    }).get();
  if (acquisitionItems.length > 0) {
    embed.fields.push({ name: 'Acquisition', value: acquisitionItems.join('\n') });
  }

  let dropTable = $('table.drop-table').first();
  if (!dropTable.length) {
    dropTable = $('table').filter((_: any, el: any) =>
      $(el).find('th').toArray().some((th: any) => $(th).text().trim() === 'Drop List')
    ).first();
  }

  const dataRows = dropTable.find('tbody tr').slice(2);
  const eventMap: Record<string, string[]> = {};
  const eventOrder: string[] = [];
  let currentEvent = '';

  dataRows.each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length === 3) {
      currentEvent = cells.eq(0).text().trim();
      if (!eventMap[currentEvent]) { eventMap[currentEvent] = []; eventOrder.push(currentEvent); }
      const stage = cellWithLink(cells.eq(1));
      const note = cells.eq(2).text().trim();
      eventMap[currentEvent].push(note ? `${stage} (${note})` : stage);
    } else if (cells.length === 2 && currentEvent) {
      const stage = cellWithLink(cells.eq(0));
      const note = cells.eq(1).text().trim();
      eventMap[currentEvent].push(note ? `${stage} (${note})` : stage);
    }
  });

  for (const ev of eventOrder) {
    embed.fields.push({ name: ev, value: eventMap[ev].join(', '), inline: true });
  }

  console.log(`[drop] "${pageTitle}": fields=${embed.fields.length}, events=${eventOrder.length}`);
  if (embed.fields.length === 0) return { type: 'notfound' };

  const pages: MessageEmbedOptions[] = [];
  for (let i = 0; i < embed.fields.length; i += 25) {
    pages.push({ title: embed.title, url: embed.url, fields: embed.fields.slice(i, i + 25) });
  }
  return { type: 'found', pages };
}

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

    try {
      let result = await fetchDropData(unit);

      let fallbackTitle: string | null = null;
      if (result.type === 'notfound') {
        const searchResults = await wikiSearch(text);
        for (const title of searchResults) {
          const fallback = await fetchDropData(title);
          if (fallback.type !== 'notfound') { result = fallback; fallbackTitle = title; break; }
        }
      }

      if (result.type === 'msg') return await ctx.send(result.msg);
      if (result.type === 'notfound') return await ctx.send("Can't find anything");
      if (fallbackTitle) await ctx.send(`_No exact match found. Showing results for **${fallbackTitle}**:_`);
      sendPages(ctx, result.pages);
    } catch (err) {
      await ctx.send("Can't find anything");
      console.log(err);
    }
  }
}
