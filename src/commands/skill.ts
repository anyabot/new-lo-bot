import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, restoreImageLink, sendPagesWithNumber, te, wikiSearch } from '../library/functions';
import { BASE_WIKI } from '..';

function addEmbed(img: string, name: string, skill: string, range: string, aoe: string, link: string) {
  const embed: MessageEmbedOptions = {
    title: name,
    url: link,
    description: skill,
    fields: []
  };
  if (img) embed.thumbnail = { url: restoreImageLink(img) };
  if (range) {
    embed.fields.push({ name: 'Range/Cost', value: range });
  }
  if (aoe) {
    embed.image = { url: restoreImageLink(aoe) };
  } else {
    embed.fields.push({ name: 'AoE', value: 'Self' });
  }
  return embed;
}

async function fetchSkillData(pageTitle: string): Promise<MessageEmbedOptions[][] | null> {
  const link = `${BASE_WIKI}/wiki/${encodeURI(pageTitle)}`;
  const res = await fetch(link, { method: 'GET' });
  const body = await res.text();
  const $ = load(body);

  let check = false;
  const pagesList: MessageEmbedOptions[][] = [];

  const skillTableCount = $('.wikitable.skilltable').length;
  console.log(`[skill] "${pageTitle}": skilltables found=${skillTableCount}`);

  $('.wikitable.skilltable').each(function (_, elem) {
    check = true;
    const $2 = load($.html(this));
    let img = $2('.wikitable.skilltable tbody tr td table tbody tr td div a img').attr('data-src');
    if (!img) { img = $2('.wikitable.skilltable tbody tr td table tbody tr td div a img').attr('src'); }

    const firstTdHtml = $2('.wikitable.skilltable tbody tr:nth-child(1) td').html();
    let state = firstTdHtml ? te(firstTdHtml) : null;
    if (state === 'Name' || state === 'Unit') { state = null; }

    const pages: MessageEmbedOptions[] = [];
    $2('.wikitable.skilltable tbody tr').each(function (_, row) {
      const $row = $2(row);
      if (!$row.find('.skill-box-description').length) return;
      const hasPortrait = $row.find('td[rowspan]').length > 0;
      const nameIdx = hasPortrait ? 2 : 1;
      const rangeIdx = hasPortrait ? 5 : 4;
      const nameHtml = $row.find('td:nth-child(' + nameIdx + ')').html();
      if (!nameHtml) return;
      let na = te(nameHtml);
      if (!na) return;
      if (state) na = state + '\n' + na;
      const des = te($row.find('.skill-box-description').text());
      const rangeHtml = $row.find('td:nth-child(' + rangeIdx + ')').html();
      const range = rangeHtml ? te(rangeHtml) : null;
      const aoe = $row.find('.skillAOE a img').attr('data-src') || $row.find('.skillAOE a img').attr('src');
      pages.push(addEmbed(img, na, des, range, aoe, link));
    });
    console.log(`[skill] skilltable parsed: ${pages.length} skills`);
    pagesList.push(pages);
  });

  return check ? pagesList : null;
}

export default class SkillCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'skill',
      description: "Search unit's skills",
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'unit',
          description: 'The unit to search skills for',
          required: true
        }
      ]
    });
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const text = ctx.options['unit'];
    if (!text) return 'No unit name';
    const unit = nameChange(text);

    try {
      let pagesList = await fetchSkillData(unit);

      let fallbackTitle: string | null = null;
      if (!pagesList) {
        const searchResults = await wikiSearch(text);
        for (const title of searchResults) {
          const fallback = await fetchSkillData(title);
          if (fallback) { pagesList = fallback; fallbackTitle = title; break; }
        }
      }

      if (!pagesList) return await ctx.send("Can't find anything");
      if (fallbackTitle) await ctx.send(`_No exact match found. Showing results for **${fallbackTitle}**:_`);
      sendPagesWithNumber(ctx, pagesList[0], pagesList[1]);
    } catch (err) {
      await ctx.send("Can't find anything");
    }
  }
}
