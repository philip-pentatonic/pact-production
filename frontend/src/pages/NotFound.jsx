import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn btn-primary btn-md"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}