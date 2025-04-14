import { and, ilike, or } from '@acme/db';
import { City } from '@acme/db/schema';

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
