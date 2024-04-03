import { getShowMediaDetails, convertImdbIdToTmdbId } from "../../../functions/tmdb";
import { getMedia } from "../../../functions/providers";
import { scrapeCustom } from "../../../additional-sources/languages/language-scraper";
import 'dotenv/config'
const scrape_english = process.env.scrape_english
const sources = ["showbox", "vidsrc", "vidsrcto"] // the other sources seemingly do not work - either with Stremio or as a whole, please open up a PR or an issue if you have any idea why as I was not able to figure it out

  
export default eventHandler(async (event) => {
    
    const path = getRouterParam(event, 'imdb')
    const nonEncoded = decodeURIComponent(path)
    const imdb = nonEncoded.split('.')[0];
    const mediaInfo = {
        imdbid: imdb.split(':')[0],
        season: imdb.split(':')[1],
        episode: imdb.split(':')[2],
    }

    const output: any = { sources: [] };

    if (scrape_english == "true") {
        const tmdb = await convertImdbIdToTmdbId(mediaInfo.imdbid)
        const media = await getShowMediaDetails(tmdb, mediaInfo.season, mediaInfo.episode)    
        for (const source of sources) {
            const stream = await getMedia(media, source)
            for (const embed in stream) {
                    const sources = stream[embed].stream;
                    for (const streamItem of sources) {
                        if (streamItem.type === "file") {
                            for (const qualityKey in streamItem.qualities) {
                                const quality = streamItem.qualities[qualityKey];
                                output.sources.push({
                                file: quality.url,
                                type: "mp4",
                                label: `${qualityKey}`
                                });
                            }
                        } else if (streamItem.type == "hls") {
                            output.sources.push({
                            file: streamItem.playlist,
                            type: "hls",
                            label: `auto`
                            })
                        }
                    }
            }
                
            
        }
    }
    
    const foreignstreams = await scrapeCustom(mediaInfo.imdbid, mediaInfo.season, mediaInfo.episode)

    for (const foreignstream of foreignstreams) {
        output.sources.push(foreignstream)
    }

    return output;
});
