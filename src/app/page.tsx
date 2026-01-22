import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { QrCode, Store, ArrowRight, MapPin } from 'lucide-react';
import type { Restaurant } from '@/types/database';

async function getRestaurants() {
  const supabase = await createServerSupabaseClient();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key1 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key2 = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || (!key1 && !key2)) {
    return {
      restaurants: [],
      error: { message: 'Missing Environment Variables. Please check .env.local', details: { url: !!url, key: !!(key1 || key2) } }
    };
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, location')
    .order('name');

  return { restaurants: (data || []) as Pick<Restaurant, 'id' | 'name' | 'slug' | 'logo_url' | 'location'>[], error };
}

export default async function HomePage() {
  const { restaurants, error } = await getRestaurants();

  if (error) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: 'var(--surface-1)', color: 'var(--text-1)' }}
      >
        <div 
          className="max-w-md p-6 rounded-[var(--radius-xl)]"
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <h1 
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--color-error)' }}
          >
            Connection Error
          </h1>
          <p className="text-body mb-4" style={{ color: 'var(--text-2)' }}>
            Could not connect to the database.
          </p>
          <pre 
            className="p-4 rounded-lg text-left text-sm overflow-auto mb-4"
            style={{ 
              background: 'var(--surface-2)',
              color: 'var(--text-3)',
              fontSize: 'var(--text-caption)'
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
          <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-caption)' }}>
            <p className="font-medium mb-2">Tips:</p>
            <ul className="list-disc pl-6 text-left space-y-1">
              <li>Check your <code>.env.local</code> file</li>
              <li>Ensure <code>NEXT_PUBLIC_SUPABASE_URL</code> is correct</li>
              <li>Restart the server with <code>npm run dev</code></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ background: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(circle at top center, rgba(255, 107, 53, 0.08), transparent 60%)'
          }}
        />
        <div className="relative max-w-lg mx-auto px-6 py-16 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span 
              className="text-4xl font-bold tracking-tight"
              style={{ color: 'var(--text-1)' }}
            >
              Sabà
            </span>
            <div 
              className="px-3 py-1 rounded-lg"
              style={{ background: 'var(--brand-color)' }}
            >
              <span className="text-4xl font-bold tracking-tight text-black">
                Menu
              </span>
            </div>
          </div>
          <p 
            className="max-w-sm mx-auto"
            style={{ 
              fontSize: 'var(--text-body-lg)',
              color: 'var(--text-3)'
            }}
          >
            The modern digital menu system for restaurants. 
            Scan a QR code at your table to start ordering.
          </p>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="font-bold flex items-center gap-2"
            style={{ fontSize: 'var(--text-title)', color: 'var(--text-1)' }}
          >
            <Store className="w-5 h-5" style={{ color: 'var(--brand-color)' }} />
            Partner Restaurants
          </h2>
          <Link
            href="/agency-admin/login"
            className="flex items-center gap-1"
            style={{ 
              fontSize: 'var(--text-caption)',
              color: 'var(--brand-color)'
            }}
          >
            Agency Login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {restaurants.length === 0 ? (
          <div 
            className="text-center py-12 rounded-[var(--radius-xl)]"
            style={{ 
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)'
            }}
          >
            <QrCode className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-4)' }} />
            <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-body)' }}>
              No restaurants yet.
            </p>
            <p style={{ color: 'var(--text-4)', fontSize: 'var(--text-caption)' }} className="mt-1">
              Set up your database and add restaurants to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map(restaurant => (
              <Link
                key={restaurant.id}
                href={`/${restaurant.slug}`}
                className="card-interactive flex items-center gap-4 group"
              >
                {/* Logo */}
                <div 
                  className="w-14 h-14 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ 
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border-1)'
                  }}
                >
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span 
                      className="text-xl font-bold"
                      style={{ color: 'var(--brand-color)' }}
                    >
                      {restaurant.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-bold truncate"
                    style={{ 
                      fontSize: 'var(--text-body)',
                      color: 'var(--text-1)'
                    }}
                  >
                    {restaurant.name}
                  </h3>
                  {restaurant.location && (
                    <p 
                      className="flex items-center gap-1 truncate"
                      style={{ 
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-3)'
                      }}
                    >
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--brand-color)' }} />
                      {restaurant.location}
                    </p>
                  )}
                  <p 
                    className="mt-0.5"
                    style={{ 
                      fontSize: '11px',
                      color: 'var(--text-4)'
                    }}
                  >
                    /{restaurant.slug}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight 
                  className="w-5 h-5 shrink-0 transition-colors"
                  style={{ color: 'var(--text-4)' }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer 
        className="max-w-lg mx-auto px-6 py-8 text-center"
        style={{ borderTop: '1px solid var(--border-1)' }}
      >
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-4)' }}>
          Built with Next.js + Supabase for restaurants in Ethiopia
        </p>
      </footer>
    </div>
  );
}
