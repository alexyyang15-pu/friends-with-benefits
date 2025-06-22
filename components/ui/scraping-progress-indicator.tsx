'use client';

interface ScrapingProgressIndicatorProps {
  isScraping: boolean;
  progress: number;
  total: number;
  error?: string;
}

export const ScrapingProgressIndicator = ({
  isScraping,
  progress,
  total,
  error,
}: ScrapingProgressIndicatorProps) => {
  if (!isScraping && !error) return null;

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200 z-50">
      <div className="max-w-4xl mx-auto">
        {error ? (
          <div className="text-red-600">
            <p className="font-bold">Scraping Error:</p>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-2">
              Enriching connections with location data... Please keep this tab
              open.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-right text-gray-600 mt-1">
              {progress} / {total}
            </p>
          </>
        )}
      </div>
    </div>
  );
}; 