import { and, ilike, or } from '@acme/db';
import type { PublicCity } from '@acme/db/schema';
import { City } from '@acme/db/schema';

export const cityToPublicCity = (city: typeof City.$inferSelect): PublicCity => {
  const state = city.country === 'United States' ? city.state : city.country;
  let title = `${city.name}, ${state}`;
  if (state === city.name) {
    title = city.name;
  }
  return {
    id: city.id,
    name: city.name,
    asciiName: city.asciiName,
    state: city.state,
    asciiState: city.asciiState,
    countryCode: city.countryCode,
    population: city.population,
    timezone: city.timezone,
    country: city.country,
    title,
  };
};

export const getLocationWhereStatement = (location: string) => {
  const keywords = location
    .split(',')
    .map((item) => item.trim())
    .filter((item) => !!item);
  const where =
    keywords.length > 0
      ? and(
          ...keywords.map((keyword, i) =>
            or(
              ...(i === 0 ? [ilike(City.name, `${keyword}%`), ilike(City.asciiName, `${keyword}%`)] : []),
              ilike(City.state, `${keyword}%`),
              ilike(City.asciiState, `${keyword}%`),
              ilike(City.country, `${keyword}%`),
              ilike(City.countryCode, keyword),
            ),
          ),
        )
      : undefined;
  return where;
};
