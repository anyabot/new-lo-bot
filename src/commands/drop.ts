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

      const catText = $('.catlinks').text();
      const isCharacter = catText.includes('Characters');
      const isEquipment = catText.includes('Equipment');
      if (!isCharacter && !isEquipment) {
        return ctx.send('Not Units / Equipment');
      }
      if (isCharacter && catText.includes('B-Rank')) {
        return ctx.send('B-Rank units are not listed in the wiki drop table.');
      }

      const embed: MessageEmbedOptions = { title: unit, url: link, fields: [] };
      if (isEquipment) {
        embed.description = 'Only SS rank drop locations are listed.';
      }

      const cellWithLink = (cell: any): string => {
        const text = $(cell).text().trim();
        if (!text) return '';
        const href = $(cell).find('a').first().attr('href');
        return href ? `[${text}](${BASE_WIKI}${href})` : text;
      };

      // Acquisition section (outside the drop table)
      const acquisitionItems = $('#Acquisition').parent().next('ul')
        .children('li').map((_, el) => {
          const text = $(el).text().trim();
          const href = $(el).find('a').first().attr('href');
          return href ? `[${text}](${BASE_WIKI}${href})` : text;
        }).get();
      if (acquisitionItems.length > 0) {
        embed.fields.push({ name: 'Acquisition', value: acquisitionItems.join('\n') });
      }

      // Try .drop-table first; fall back to finding by "Drop List" header text
      let dropTable = $('table.drop-table').first();
      if (!dropTable.length) {
        dropTable = $('table').filter((_: any, el: any) =>
          $(el).find('th').toArray().some((th: any) => $(th).text().trim() === 'Drop List')
        ).first();
      }

      // Skip the two header rows (colspan title + column labels), then walk each data row.
      // Rows with 3 TDs start a new event; rows with 2 TDs are rowspan continuations.
      const dataRows = dropTable.find('tbody tr').slice(2);
      const eventMap: Record<string, string[]> = {};
      const eventOrder: string[] = [];
      let currentEvent = '';

      dataRows.each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length === 3) {
          currentEvent = cells.eq(0).text().trim();
          if (!eventMap[currentEvent]) {
            eventMap[currentEvent] = [];
            eventOrder.push(currentEvent);
          }
          const stage = cellWithLink(cells.eq(1));
          const note  = cells.eq(2).text().trim();
          eventMap[currentEvent].push(note ? `${stage} (${note})` : stage);
        } else if (cells.length === 2 && currentEvent) {
          const stage = cellWithLink(cells.eq(0));
          const note  = cells.eq(1).text().trim();
          eventMap[currentEvent].push(note ? `${stage} (${note})` : stage);
        }
      });

      for (const ev of eventOrder) {
        embed.fields.push({ name: ev, value: eventMap[ev].join(', '), inline: true });
      }

      if (embed.fields.length === 0) {
        ctx.send('No Drop Location');
        return;
      }

      const pages: MessageEmbedOptions[] = [];
      for (let i = 0; i < embed.fields.length; i += 25) {
        pages.push({ title: embed.title, url: embed.url, fields: embed.fields.slice(i, i + 25) });
      }
      sendPages(ctx, pages);
    } catch (err) {
      ctx.send("Can't find anything");
      console.log(err, link);
    }
  }
}
