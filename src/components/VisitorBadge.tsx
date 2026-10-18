
import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

const WORKER_URL =
  'https://kingbrezz-report-api.brezzteam5.workers.dev';

const PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

function periodKey() {
  return String(Math.floor(Date.now() / PERIOD_MS));
}

export function VisitorBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVisitors() {
      const bucket = periodKey();
      const seenKey = `kb-visitor-seen-${bucket}`;

      let shouldIncrement = false;

      try {
        shouldIncrement = !localStorage.getItem(seenKey);
      } catch {
        // Jika localStorage tidak tersedia, tetap tampilkan hitungan.
      }

      try {
        if (shouldIncrement) {
          const response = await fetch(
            `${WORKER_URL}/api/visitors/up`,
            {
              method: 'POST',
              cache: 'no-store',
            }
          );

          if (!response.ok) {
            throw new Error('Failed to increment visitor count');
          }

          // Tandai hanya setelah increment berhasil.
          try {
            localStorage.setItem(seenKey, '1');
          } catch {
            // Badge tetap dapat bekerja tanpa localStorage.
          }
        }

        const response = await fetch(
          `${WORKER_URL}/api/visitors`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load visitor count');
        }

        const data: {
          success?: boolean;
          visitors?: number;
        } = await response.json();

        if (
          !data.success ||
          typeof data.visitors !== 'number' ||
          !Number.isFinite(data.visitors)
        ) {
          throw new Error('Invalid visitor count');
        }

        if (!cancelled) {
          setCount(data.visitors);
        }
      } catch {
        if (!cancelled) {
          setCount(null);
        }
      }
    }

    void loadVisitors();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="kb-visitor-badge"
      title="Visitors in the current 14-day period"
      aria-label={
        count === null
          ? 'Visitor count unavailable'
          : `${count} visitors in the current 14-day period`
      }
    >
      <Eye size={14} aria-hidden="true" />
      <span>
        {count === null ? '—' : count.toLocaleString()}
      </span>
    </div>
  );
}
