// Shared offline guidance, not a diagnostic or comprehensive emergency detector.
export const CHAT_LIMITS = Object.freeze({question:2000,answer:6000,conversation:9000,messages:9,bodyBytes:40000});
export const URGENT_GUIDANCE = 'If someone may have taken too much medicine, contact local emergency services or a poison centre now, even if they feel well. Do not wait for this chat. Do not make them vomit. Keep the medicine packaging for the medical team. Severe breathing difficulty, collapse or a seizure needs emergency help immediately.';
export const TRUSTED_SOURCES = Object.freeze([
  {name:'MedlinePlus medicine information (US)',url:'https://medlineplus.gov/druginformation.html'},
  {name:'NHS medicines A–Z (UK)',url:'https://www.nhs.uk/medicines/'},
  {name:'NHS poisoning guidance (UK)',url:'https://www.nhs.uk/conditions/poisoning/'},
  {name:'FDA supplement safety (US)',url:'https://www.fda.gov/consumers/consumer-updates/fda-101-dietary-supplements'}
]);
export function needsUrgentHelp(text){
  const s=String(text).normalize('NFKC').toLowerCase().replace(/[’']/g,'');
  return /overdos|poison|too much|too many|extra (dose|tablet|pill)|double[ -]?dose|took.{0,40}(twice|double|extra)|swallowed.{0,40}(tablets|pills)|cant breathe|cannot breathe|difficulty breathing|struggling to breathe|throat.{0,15}swell|lips?.{0,15}swell|unconscious|unresponsive|seizure|kill myself|end my life|want to die/.test(s);
}
