export interface Section {
  code: string;
  name: string;
  prefix: string;
  stickers: string[];
  type: 'special' | 'sponsor' | 'team';
}

function range(prefix: string, from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => `${prefix}${from + i}`);
}

export const SECTIONS: Section[] = [
  {
    code: 'ABT',
    name: 'Abertura',
    prefix: '',
    stickers: ['00'],
    type: 'special',
  },
  {
    code: 'FWC',
    name: 'Copa do Mundo',
    prefix: 'FWC',
    stickers: range('FWC', 1, 19),
    type: 'special',
  },
  {
    code: 'CC',
    name: 'Refrigerante',
    prefix: 'CC',
    stickers: range('CC', 1, 14),
    type: 'sponsor',
  },
  // Teams (ordered by position)
  { code: 'MEX', name: 'México',          prefix: 'MEX', stickers: range('MEX', 1, 20), type: 'team' },
  { code: 'RSA', name: 'África do Sul',   prefix: 'RSA', stickers: range('RSA', 1, 20), type: 'team' },
  { code: 'KOR', name: 'Coréia',          prefix: 'KOR', stickers: range('KOR', 1, 20), type: 'team' },
  { code: 'CZE', name: 'Rep. Tcheca',     prefix: 'CZE', stickers: range('CZE', 1, 20), type: 'team' },
  { code: 'CAN', name: 'Canadá',          prefix: 'CAN', stickers: range('CAN', 1, 20), type: 'team' },
  { code: 'BIH', name: 'Bósnia',          prefix: 'BIH', stickers: range('BIH', 1, 20), type: 'team' },
  { code: 'QAT', name: 'Catar',           prefix: 'QAT', stickers: range('QAT', 1, 20), type: 'team' },
  { code: 'SUI', name: 'Suíça',           prefix: 'SUI', stickers: range('SUI', 1, 20), type: 'team' },
  { code: 'BRA', name: 'Brasil',          prefix: 'BRA', stickers: range('BRA', 1, 20), type: 'team' },
  { code: 'MAR', name: 'Marrocos',        prefix: 'MAR', stickers: range('MAR', 1, 20), type: 'team' },
  { code: 'HAI', name: 'Haiti',           prefix: 'HAI', stickers: range('HAI', 1, 20), type: 'team' },
  { code: 'SCO', name: 'Escócia',         prefix: 'SCO', stickers: range('SCO', 1, 20), type: 'team' },
  { code: 'USA', name: 'Estados Unidos',  prefix: 'USA', stickers: range('USA', 1, 20), type: 'team' },
  { code: 'PAR', name: 'Paraguai',        prefix: 'PAR', stickers: range('PAR', 1, 20), type: 'team' },
  { code: 'AUS', name: 'Austrália',       prefix: 'AUS', stickers: range('AUS', 1, 20), type: 'team' },
  { code: 'TUR', name: 'Turquia',         prefix: 'TUR', stickers: range('TUR', 1, 20), type: 'team' },
  { code: 'GER', name: 'Alemanha',        prefix: 'GER', stickers: range('GER', 1, 20), type: 'team' },
  { code: 'CUW', name: 'Curaçau',         prefix: 'CUW', stickers: range('CUW', 1, 20), type: 'team' },
  { code: 'CIV', name: 'Costa do Marfim', prefix: 'CIV', stickers: range('CIV', 1, 20), type: 'team' },
  { code: 'ECU', name: 'Equador',         prefix: 'ECU', stickers: range('ECU', 1, 20), type: 'team' },
  { code: 'NED', name: 'Holanda',         prefix: 'NED', stickers: range('NED', 1, 20), type: 'team' },
  { code: 'JPN', name: 'Japão',           prefix: 'JPN', stickers: range('JPN', 1, 20), type: 'team' },
  { code: 'SWE', name: 'Suécia',          prefix: 'SWE', stickers: range('SWE', 1, 20), type: 'team' },
  { code: 'TUN', name: 'Tunísia',         prefix: 'TUN', stickers: range('TUN', 1, 20), type: 'team' },
  { code: 'BEL', name: 'Bélgica',         prefix: 'BEL', stickers: range('BEL', 1, 20), type: 'team' },
  { code: 'EGV', name: 'Egito',           prefix: 'EGV', stickers: range('EGV', 1, 20), type: 'team' },
  { code: 'IRN', name: 'Irã',             prefix: 'IRN', stickers: range('IRN', 1, 20), type: 'team' },
  { code: 'NZL', name: 'Nova Zelândia',   prefix: 'NZL', stickers: range('NZL', 1, 20), type: 'team' },
  { code: 'ESP', name: 'Espanha',         prefix: 'ESP', stickers: range('ESP', 1, 20), type: 'team' },
  { code: 'CPV', name: 'Cabo Verde',      prefix: 'CPV', stickers: range('CPV', 1, 20), type: 'team' },
  { code: 'KSA', name: 'Arábia Saudita',  prefix: 'KSA', stickers: range('KSA', 1, 20), type: 'team' },
  { code: 'URU', name: 'Uruguai',         prefix: 'URU', stickers: range('URU', 1, 20), type: 'team' },
  { code: 'FRA', name: 'França',          prefix: 'FRA', stickers: range('FRA', 1, 20), type: 'team' },
  { code: 'SEN', name: 'Senegal',         prefix: 'SEN', stickers: range('SEN', 1, 20), type: 'team' },
  { code: 'IRQ', name: 'Iraque',          prefix: 'IRQ', stickers: range('IRQ', 1, 20), type: 'team' },
  { code: 'NOR', name: 'Noruega',         prefix: 'NOR', stickers: range('NOR', 1, 20), type: 'team' },
  { code: 'ARG', name: 'Argentina',       prefix: 'ARG', stickers: range('ARG', 1, 20), type: 'team' },
  { code: 'ALG', name: 'Algeria',         prefix: 'ALG', stickers: range('ALG', 1, 20), type: 'team' },
  { code: 'AUT', name: 'Áustria',         prefix: 'AUT', stickers: range('AUT', 1, 20), type: 'team' },
  { code: 'JOR', name: 'Jordânia',        prefix: 'JOR', stickers: range('JOR', 1, 20), type: 'team' },
  { code: 'POR', name: 'Portugal',        prefix: 'POR', stickers: range('POR', 1, 20), type: 'team' },
  { code: 'COD', name: 'Congo',           prefix: 'COD', stickers: range('COD', 1, 20), type: 'team' },
  { code: 'UZB', name: 'Uzbequistão',     prefix: 'UZB', stickers: range('UZB', 1, 20), type: 'team' },
  { code: 'COL', name: 'Colômbia',        prefix: 'COL', stickers: range('COL', 1, 20), type: 'team' },
  { code: 'ENG', name: 'Inglaterra',      prefix: 'ENG', stickers: range('ENG', 1, 20), type: 'team' },
  { code: 'CRO', name: 'Croácia',         prefix: 'CRO', stickers: range('CRO', 1, 20), type: 'team' },
  { code: 'GHA', name: 'Ghana',           prefix: 'GHA', stickers: range('GHA', 1, 20), type: 'team' },
  { code: 'PAN', name: 'Panamá',          prefix: 'PAN', stickers: range('PAN', 1, 20), type: 'team' },
];

export const TOTAL_STICKERS = SECTIONS.reduce((sum, s) => sum + s.stickers.length, 0);
