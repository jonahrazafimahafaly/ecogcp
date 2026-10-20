import { Package } from 'lucide-react';

const Footer = () => (
  <footer className="mt-auto bg-white border-t border-gray-100">
    <div className="px-4 py-8 mx-auto max-w-7xl">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-lg w-7 h-7 bg-primary-600">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">ShopMG</span>
        </div>
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} ShopMG — Application MERN Microservices
        </p>
      </div>
    </div>
  </footer>
);
export default Footer;