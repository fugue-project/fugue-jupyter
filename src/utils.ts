import { RegExpForeignCodeExtractor } from '@krassowski/jupyterlab-lsp';
import { Mode } from 'codemirror';
import { ICodeMirror } from '@jupyterlab/codemirror';

function cell_magic(language: string) {
  return `%%${language}.*`;
}
function start(language: string) {
  return `--start-${language}`;
}
function end(language: string) {
  return `--end-${language}`;
}
function fsql_start() {
  return `fsql[\\s\\S]*\\([\\s\\S]*\\"\\"\\"`;
}
function fsql_end() {
  return `\\"\\"\\"`;
}

const BEGIN = '(?:^|\n)';

export function sqlCodeMirrorModesFor(
  language: string,
  sqlMode: Mode<unknown>
) {
  return [
    {
      open: `${start(language)}`,
      close: `${end(language)}`,
      // parseDelimiters is set to true which considers
      // the marker as part of the SQL statement
      // it is thus syntax highlighted as a comment
      parseDelimiters: true,
      mode: sqlMode
    },
    {
      open: (RegExp(`${fsql_start()}`) as unknown) as string,
      close: (RegExp(`${fsql_end()}`) as unknown) as string,
      parseDelimiters: false,
      mode: sqlMode
    },
    {
      open: (RegExp(`${cell_magic(language)}`) as unknown) as string,
      close: '__A MARKER THAT WILL NEVER BE MATCHED__', // Cell magic: capture chars till the end of the cell
      parseDelimiters: false,
      mode: sqlMode
    }
  ];
}

export function cellMagicExtractor(
  language: string
): RegExpForeignCodeExtractor {
  return new RegExpForeignCodeExtractor({
    language: language,
    pattern: `${BEGIN}${cell_magic(language)}\n([^]*)`,
    foreign_capture_groups: [1],
    is_standalone: true,
    file_extension: language
  });
}

export function markerExtractor(language: string): RegExpForeignCodeExtractor {
  return new RegExpForeignCodeExtractor({
    language: language,
    pattern: `${start(language)}.*?\n([^]*?)${end(language)}`,
    foreign_capture_groups: [1],
    is_standalone: true,
    file_extension: language
  });
}

export function fsqlBlockExtractor(language: string): RegExpForeignCodeExtractor {
  return new RegExpForeignCodeExtractor({
    language: language,
    pattern: `${fsql_start()}.*?\n([^]*?)${fsql_end()}`,
    foreign_capture_groups: [1],
    is_standalone: true,
    file_extension: language
  });
}

function set(str: string) {
  const obj: any = {},
    words = str.split(' ');
  for (let i = 0; i < words.length; ++i) {
    obj[words[i]] = true;
  }
  return obj;
}

const fugue_keywords =
  'fill hash rand even presort persist broadcast params process output outtransform rowcount concurrency prepartition zip print title save append parquet csv json single checkpoint weak strong deterministic yield connect sample seed take sub callback dataframe file';

/**
 * Register text editor based on file type.
 * @param c
 * @param language
 */
export function registerCodeMirrorFor(c: ICodeMirror, language: string) {
  c.CodeMirror.defineMode(
    language,
    (config: CodeMirror.EditorConfiguration, modeOptions?: any) => {
      const mode = c.CodeMirror.getMode(config, {
        name: 'sql', // @ts-ignore
        keywords: set(
          fugue_keywords +
            ' add after all alter analyze and anti archive array as asc at between bucket buckets by cache cascade case cast change clear cluster clustered codegen collection column columns comment commit compact compactions compute concatenate cost create cross cube current current_date current_timestamp database databases data dbproperties defined delete delimited deny desc describe dfs directories distinct distribute drop else end escaped except exchange exists explain export extended external false fields fileformat first following for format formatted from full function functions global grant group grouping having if ignore import in index indexes inner inpath inputformat insert intersect interval into is items join keys last lateral lazy left like limit lines list load local location lock locks logical macro map minus msck natural no not null nulls of on optimize option options or order out outer outputformat over overwrite partition partitioned partitions percent preceding principals purge range recordreader recordwriter recover reduce refresh regexp rename repair replace reset restrict revoke right rlike role roles rollback rollup row rows schema schemas select semi separated serde serdeproperties set sets show skewed sort sorted start statistics stored stratify struct table tables tablesample tblproperties temp temporary terminated then to touch transaction transactions transform true truncate unarchive unbounded uncache union unlock unset use using values view when where window with'
        ),
        builtin: set(
          'date datetime tinyint smallint int bigint boolean float double string binary timestamp decimal array map struct uniontype delimited serde sequencefile textfile rcfile inputformat outputformat'
        ),
        atoms: set('false true null'),
        operatorChars: /^[*\/+\-%<>!=~&|^]/,
        dateSQL: set('time'),
        support: set('ODBCdotTable doubleQuote zerolessFloat')
      });
      return mode;
    }
  );
  c.CodeMirror.defineMIME(`text/x-${language}`, language);
  c.CodeMirror.modeInfo.push({
    ext: [language],
    mime: `text/x-${language}`,
    mode: language,
    name: language
  });
}
