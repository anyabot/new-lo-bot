import { SlashCommand, CommandOptionType, SlashCreator, CommandContext, MessageEmbedOptions } from 'slash-create';
import { load } from 'cheerio';
import { nameChange, restoreImageLink, sendPages, sendPagesWithNumber, te } from '../library/functions';
import { BASE_WIKI } from '..';

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
    const link = `${BASE_WIKI}/wiki/${encodeURI(unit)}`;
    try {
      let check = false
      const res = await fetch(link, { method: 'GET' });
      const body = await res.text();
      const $ = load(body);
      let pages: MessageEmbedOptions[]
      let pagesList: MessageEmbedOptions[][] = []
      $('.wikitable.skilltable').each(function (i, elem) {
        check = true
        let $2 = load($.html(this));
        let siz = $2('.wikitable.skilltable tbody').find('tr').length
        let img = $2('.wikitable.skilltable tbody tr td table tbody tr td div a img').attr('data-src')
        if (!img) { img = $2('.wikitable.skilltable tbody tr td table tbody tr td div a img').attr('src') }
        let state = te($2('.wikitable.skilltable tbody tr:nth-child(1) td').html().trim())
        if (state == "Name") { state = null }
        if (state == "Unit") { state = null }
        pages = []
        for (var i = 1; i < siz; i++) {
          let siz2 = $2('.wikitable.skilltable tbody tr:nth-child(' + i + ')').find('td').length
          if (siz2 == 6) {
            let na = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(2)').html().trim())
            if (na != "Name") {
              if (state) { na = state + "\n" + na }
              let des = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(3)').text().trim())
              let siz3 = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ')').find('td').length
              let aoe: string
              if (siz3 == 1) {
                aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ') .skillAOE a img').attr('data-src')
                if (!aoe) { aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ') .skillAOE a img').attr('src') }
              }
              else {
                aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + i + ') .skillAOE a img').attr('data-src')
                if (!aoe) { aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + i + ') .skillAOE a img').attr('src') }
              }
              let range = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(5)').html().trim())
              pages.push(addEmbed(img, na, des, range, aoe, link))
            }
          }
          else if (siz2 == 4) {
            let na = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(1)').html().trim())
            if (na != "Name") {
              if (state) { na = state + "\n" + na }
              let des = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(2)').text().trim())
              let siz3 = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ')').find('td').length
              let aoe: string
              if (siz3 == 1) {
                aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ') .skillAOE a img').attr('data-src')
                if (!aoe) { aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + (i + 1) + ') .skillAOE a img').attr('src') }
              }
              else {
                aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + i + ') .skillAOE a img').attr('data-src')
                if (!aoe) { aoe = $2('.wikitable.skilltable tbody tr:nth-child(' + i + ') .skillAOE a img').attr('src') }
              }
              let range = te($2('.wikitable.skilltable tbody tr:nth-child(' + i + ') td:nth-child(4)').html().trim())
              pages.push(addEmbed(img, na, des, range, aoe, link))
            }
          }
        }
        pagesList.push(pages)
      })
      if (check) {
        sendPagesWithNumber(ctx, pagesList[0], pagesList[1])
      }
      else {
        return ctx.send("Can't find anything");
      }
    } catch (err) {
      ctx.send("Can't find anything");
      // console.log(err, link);
    }
  }
}
function addEmbed(img: string, name: string, skill: string, range: string, aoe: string, link: string) {
  let embed: MessageEmbedOptions = {
    title: name,
    url: link,
    thumbnail: {url: restoreImageLink(img)},
    description: skill,
    fields: []
  };
	if (range) {
		embed.fields.push({
      name: 'Range/Cost',
      value: range,
    },);
	}
	if (aoe) {
		embed.image = {url: restoreImageLink(aoe)}
	}
	else {
    embed.fields.push({
      name: 'AoE',
      value: "Self",
    },);
	}
  console.log(embed)
	return embed
}