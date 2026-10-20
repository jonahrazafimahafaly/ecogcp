const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-6xl text-gray-300">{icon}</div>}
    <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
    {description && (
      <p className="max-w-sm mb-6 text-gray-500">{description}</p>
    )}
    {action}
  </div>
);
export default EmptyState;