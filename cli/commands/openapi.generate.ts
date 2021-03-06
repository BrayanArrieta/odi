import { CommanderStatic } from "commander";
import { writeFileSync } from "fs";
import { prompt, Questions } from "inquirer";
import { join, resolve } from "path";
import { generateOpenAPI } from "../generators/openapi.generator";

export default function(program: CommanderStatic) {
    program
        .command("docs")
        .option("-s, --sources <path>", "set sources path" )
        .option("-e, --entry <path>", "set entry file path")
        .option("-o, --output <path>", "set output path ")
        .option("-l, --link [urls]", "set server links", (val, memo) => [...memo, val], [])
        .option("-t, --title <title>", "set app titile", "Docs")
        .description("Generate API docs")
        .action((options) => {

            if (!options.sources) {
                return console.log("Sources must be specified");
            }

            action(options);
        });
}

async function action({ sources, entry, output, link, title }: any) {
    const doc = await generateOpenAPI(process.cwd(), sources, (entry || join(sources, "./index.ts")));

    doc.info.title = title;
    doc.servers = link.map((link: string) => ({ url: link }));

    return writeFileSync(resolve(process.cwd(), output || `./swagger-${doc.info.version}.json`), JSON.stringify(doc, null, 4));
}
