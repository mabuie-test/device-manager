interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 transition hover:border-ocean/50 hover:shadow-xl hover:shadow-ocean/10">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-slate-300">{description}</p>
    </article>
  );
};

export default FeatureCard;
