import { FaCode, FaHatWizard } from 'react-icons/fa6';
import { GiTakeMyMoney } from 'react-icons/gi';

const features = [
  {
    description: 'Highlight verified skills and achievements backed by real data.',
    icon: <FaHatWizard size={22} />,
    title: 'Showcase Your Skills with Credibility',
  },
  {
    description: 'Follow the latest tech trends, discover innovative companies, keep tabs on gigs that excite you.',
    icon: <FaCode size={22} />,
    title: 'Stay Ahead of the Curve',
  },
  {
    description: 'Attract contracts, side-gigs, and job opportunities perfectly aligned with your expertise and passions.',
    icon: <GiTakeMyMoney size={22} />,
    title: 'Unlock Opportunities',
  },
];

export const FeaturesGrid = () => {
  return (
    <div className="bg-card rounded-lg border p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title}>
            <div className="flex gap-3">
              {feature.icon}
              <p className="font-semibold">{feature.title}</p>
            </div>
            <p className="text-muted-foreground mt-3">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
