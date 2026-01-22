'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useFasting } from '@/context/FastingContext';
import { useLanguage } from '@/context/LanguageContext';
import type { RestaurantWithMenu } from '@/types/database';
import { MenuHeader } from './MenuHeader';
import { CategoryTabs } from './CategoryTabs';
import { DishCard } from './DishCard';
import { DishDetailModal } from './DishDetailModal';
import { FeaturedDishCard } from './FeaturedDishCard';
import { SearchComponent } from './SearchComponent';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { Coffee, UtensilsCrossed, Leaf, Star } from 'lucide-react';

interface Props {
    restaurant: RestaurantWithMenu;
    tableNumber: string | null;
}

export function MenuPage({ restaurant, tableNumber }: Props) {
    const [hasMounted, setHasMounted] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // Single toggle: Food or Drinks (replaces swipe navigation)
    const [activeSection, setActiveSection] = useState<'food' | 'drinks'>('food');

    const { setTableNumber } = useCart();
    const { isFastingMode } = useFasting();
    const { language, t } = useLanguage();

    // Check if splash was previously dismissed
    useEffect(() => {
        setHasMounted(true);
        const splashDismissed = localStorage.getItem('splashDismissed');
        if (splashDismissed === 'true') {
            setShowSplash(false);
        }
    }, []);

    // Set table number from URL on mount
    useEffect(() => {
        if (tableNumber) {
            setTableNumber(tableNumber);
        }
    }, [tableNumber, setTableNumber]);

    // Handle splash dismissal with persistence
    const handleSplashDismiss = () => {
        setShowSplash(false);
        localStorage.setItem('splashDismissed', 'true');
        window.scrollTo(0, 0);
    };

    // Get all items flattened with rich mock data injection
    const allItems = useMemo(() => {
        return restaurant.categories.flatMap(cat =>
            (cat.items || []).map(item => ({
                ...item,
                categoryId: cat.id,
                categoryName: cat.name,
                categoryName_am: (cat as any).name_am,
                section: (cat as any).section // Using the new section column from DB
            }))
        );
    }, [restaurant.categories]);

    // Determine section for DB items
    const getItemSection = (item: any): 'food' | 'drinks' => {
        if (item.section) return item.section;
        const catName = (item.categoryName || '').toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        if (catName.includes('drink') || catName.includes('beverage') || catName.includes('coffee') ||
            catName.includes('tea') || catName.includes('juice') || catName.includes('beer') ||
            catName.includes('wine') || catName.includes('hot') || catName.includes('cold') ||
            catName.includes('cocktail') || catName.includes('spirit') || catName.includes('water') ||
            itemName.includes('coffee') || itemName.includes('tea') || itemName.includes('juice') ||
            itemName.includes('soda') || itemName.includes('beer') || itemName.includes('wine')) {
            return 'drinks';
        }
        return 'food';
    };

    // Get dynamic categories for current section
    const getDynamicCategories = () => {
        const sectionItems = allItems.filter(item => getItemSection(item) === activeSection);
        const categoryMap = new Map<string, { id: string, label: string, labelAm: string }>();

        sectionItems.forEach(item => {
            // Skip "Fasting" category items from showing up as a filter (header toggle handles it)
            // Skip broad "Drinks" category title if it appears in filter list
            if (item.categoryName === 'Fasting' || item.categoryName === 'Drinks') return;

            if (!categoryMap.has(item.categoryId)) {
                categoryMap.set(item.categoryId, {
                    id: item.categoryId,
                    label: item.categoryName,
                    labelAm: item.categoryName_am || item.categoryName // Use Amharic name from DB if available
                });
            }
        });

        return Array.from(categoryMap.values());
    };

    // Filter items based on current section and filters
    const getFilteredItems = () => {
        let items = [...allItems].filter(item => getItemSection(item) === activeSection);

        // Category filter
        if (selectedCategory && selectedCategory !== 'all') {
            if (selectedCategory.startsWith('filter:')) {
                const filter = selectedCategory.split(':')[1];
                if (filter === 'fasting') items = items.filter(i => i.is_fasting || i.dietary_tags?.includes('V') || i.dietary_tags?.includes('Veg'));
                if (filter === 'spicy') items = items.filter(i => (i.spicy_level && i.spicy_level > 0) || i.dietary_tags?.includes('Spicy'));
                if (filter === 'gf') items = items.filter(i => i.dietary_tags?.includes('GF') || i.dietary_tags?.includes('Gluten-Free'));
                if (filter === 'chef') items = items.filter(i => i.is_chef_special);
            } else {
                items = items.filter(item => item.categoryId === selectedCategory);
            }
        }

        // Fasting filter
        if (isFastingMode) {
            items = items.filter(item => item.is_fasting);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter((item: any) => {
                const name = language === 'am' && item.name_am ? item.name_am : item.name;
                const description = language === 'am' && item.description_am ? item.description_am : (item.description || '');

                // Search in name, description, ingredients, and tags
                return (
                    (name || '').toLowerCase().includes(query) ||
                    (description || '').toLowerCase().includes(query) ||
                    (item.ingredients && item.ingredients.some((ing: string) => ing.toLowerCase().includes(query))) ||
                    (item.dietary_tags && item.dietary_tags.some((tag: string) => tag.toLowerCase().includes(query)))
                );
            });
        }

        return items;
    };

    // Get featured items (chef specials or top popular)
    const getFeaturedItems = (items: typeof allItems) => {
        const specials = items.filter(item => item.is_chef_special);
        if (specials.length >= 3) return specials.slice(0, 4);
        // Fallback to top popular
        return [...items].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 4);
    };

    // Get regular items (excluding featured)
    const getRegularItems = (items: typeof allItems, featured: typeof allItems) => {
        if (searchQuery) return items; // Show all when searching
        const featuredIds = new Set(featured.map(i => i.id));
        const remaining = items.filter(item => !featuredIds.has(item.id));
        return remaining.length > 0 ? remaining : items;
    };

    const filteredItems = getFilteredItems();
    const featuredItems = getFeaturedItems(filteredItems);
    const regularItems = getRegularItems(filteredItems, featuredItems);
    const dynamicCategories = getDynamicCategories();

    // Reset category when switching sections
    const handleSectionChange = (section: 'food' | 'drinks') => {
        setActiveSection(section);
        setSelectedCategory(null);
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen relative" style={{ background: 'var(--surface-1)' }}>
            {/* Splash Screen with persistence */}
            <AnimatePresence mode="wait">
                {hasMounted && showSplash && (
                    <SplashScreen key="splash" onOpen={handleSplashDismiss} />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className={`pb-32 ${hasMounted && showSplash ? 'hidden' : 'block'}`}>
                <MenuHeader
                    restaurant={restaurant}
                    tableNumber={tableNumber}
                />

                <main className="w-full pt-[var(--header-height)] max-w-lg mx-auto">
                    {/* Fixed Segmented Control - Food/Drinks */}
                    <div className="px-4 pb-3 pt-0 sticky top-[var(--header-height)] z-40 -translate-y-[1px]" style={{ background: 'var(--surface-1)' }}>
                        <div className="segmented-control">
                            <button
                                className="segmented-control-item"
                                data-active={activeSection === 'food'}
                                onClick={() => handleSectionChange('food')}
                            >
                                <UtensilsCrossed className="w-4 h-4" />
                                <span>{language === 'am' ? 'ምግብ' : 'Food'}</span>
                            </button>
                            <button
                                className="segmented-control-item"
                                data-active={activeSection === 'drinks'}
                                onClick={() => handleSectionChange('drinks')}
                            >
                                <Coffee className="w-4 h-4" />
                                <span>{language === 'am' ? 'መጠጥ' : 'Drinks'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Promo Carousel - Compact */}
                    <div className="mb-4">
                        <PromoCarousel restaurant={restaurant} />
                    </div>

                    {/* Search - Simplified */}
                    <div className="px-4 mb-4">
                        <SearchComponent
                            value={searchQuery}
                            onChange={setSearchQuery}
                            section={activeSection}
                        />
                    </div>



                    {/* Category Chips */}
                    <div className="mb-4">
                        <CategoryTabs
                            categories={dynamicCategories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={setSelectedCategory}
                        />
                    </div>

                    {/* Featured Section - Compact horizontal scroll */}
                    {featuredItems.length > 0 && !searchQuery && (
                        <div className="mb-6">
                            <div className="px-4 flex justify-between items-center mb-3">
                                <div>
                                    <span className="text-caption text-brand block mb-0.5">
                                        {language === 'am' ? 'የተመረጡ' : 'Recommended'}
                                    </span>
                                    <h2 className="text-title">
                                        {activeSection === 'food'
                                            ? (language === 'am' ? 'ልዩ ምግቦች' : "Chef's Picks")
                                            : (language === 'am' ? 'ተወዳጅ መጠጦች' : 'Popular Drinks')}
                                    </h2>
                                </div>
                            </div>

                            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-2">
                                {featuredItems.map((item: any) => (
                                    <FeaturedDishCard
                                        key={item.id}
                                        item={item}
                                        restaurant={restaurant}
                                        onClick={() => setSelectedItem(item)}
                                    // Fasting badge and hover state are handled within FeaturedDishCard
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Menu Grid */}
                    <div className="px-4 pb-32">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <span className="text-caption text-brand block mb-0.5">
                                    {activeSection === 'food'
                                        ? (language === 'am' ? 'ሁሉም ምግቦች' : 'All Food')
                                        : (language === 'am' ? 'ሁሉም መጠጦች' : 'All Drinks')}
                                </span>
                                <h2 className="text-title">
                                    {searchQuery
                                        ? (language === 'am' ? 'የፍለጋ ውጤቶች' : 'Search Results')
                                        : selectedCategory
                                            ? dynamicCategories.find(c => c.id === selectedCategory)?.label || (language === 'am' ? 'ዋና ምናሌ' : 'Main Menu')
                                            : (language === 'am' ? 'ዋና ምናሌ' : 'Main Menu')}
                                </h2>
                            </div>
                            <span className="text-caption text-muted">
                                {regularItems.length} {language === 'am' ? 'ዕቃዎች' : 'items'}
                            </span>
                        </div>

                        {regularItems.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {regularItems.map((item: any) => (
                                    <DishCard
                                        key={item.id}
                                        item={item}
                                        restaurant={restaurant}
                                        onClick={() => setSelectedItem(item)}
                                    // Fasting badge and hover state are handled within DishCard
                                    />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16 card"
                            >
                                <p className="text-muted">
                                    {language === 'am'
                                        ? 'ምንም ውጤት አልተገኘም'
                                        : `No ${activeSection} found matching your criteria`}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>

            {/* Detail Modal */}
            <DishDetailModal
                item={selectedItem}
                restaurant={restaurant}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}
