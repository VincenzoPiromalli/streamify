import { getMovieMediaDetails, convertImdbIdToTmdbId } from "../../../functions/tmdb";
import { getMedia } from "../../../functions/providers";
import { scrapeCustom } from "../../../additional-sources/languages/language-scraper";
import 'dotenv/config'
const scrape_english = process.env.scrape_english
const sources = ["showbox", "vidsrc", "vidsrcto"] // the other sources seemingly do not work - either with Stremio or as a whole, please open up a PR or an issue if you have any idea why as I was not able to figure it out


export default eventHandler(async (event) => {
    const output: any = {
        sources: []
    };

    const path = getRouterParam(event, 'imdb')
    const imdb = path.split('.')[0];

    if (scrape_english == "true") {
        const tmdb = await convertImdbIdToTmdbId(imdb)
        const media = await getMovieMediaDetails(tmdb)

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


    const foreignstreams = await scrapeCustom(imdb, 0, 0)

    for (const foreignstream of foreignstreams) {
        output.sources.push(foreignstream)
    }

    return output;
});
