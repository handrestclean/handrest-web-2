import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sofa, BedDouble, Shirt, Zap, Wrench, Sparkles, Wind, Layers, Fan, Thermometer, LucideIcon, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAddonServices } from '@/hooks/useAddons';
import { useCustomFeatures } from '@/hooks/useCustomFeatures';
import { useCategoryFeatureMappings } from '@/hooks/useCategoryFeatures';

const MINIMUM_ORDER = 500;

const iconMap: Record<string, LucideIcon> = {
  sofa: Sofa, 'bed-double': BedDouble, shirt: Shirt, zap: Zap, wrench: Wrench,
  sparkles: Sparkles, wind: Wind, layers: Layers, fan: Fan, thermometer: Thermometer,
};

interface BuildServiceFormProps {
  categoryName?: string;
  categoryId?: string;
  onSubmit: (selectedFeatureIds: string[], selectedAddonIds: string[], totalPrice: number) => void;
}

export function BuildServiceForm({ categoryName, categoryId, onSubmit }: BuildServiceFormProps) {
  const [featureCounts, setFeatureCounts] = useState<Record<string, number>>({});
  const [addonCounts, setAddonCounts] = useState<Record<string, number>>({});
  const { data: addons, isLoading: addonsLoading } = useAddonServices();
  const { data: allCustomFeatures, isLoading: featuresLoading } = useCustomFeatures();
  const { data: mappings } = useCategoryFeatureMappings();

  const customFeatures = allCustomFeatures?.filter(f => {
    if (!categoryId || !mappings) return true;
    const featureMappings = mappings.filter(m => m.custom_feature_id === f.id);
    if (featureMappings.length === 0) return true;
    return featureMappings.some(m => m.category_id === categoryId);
  });

  const updateCount = (
    setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
    id: string,
    delta: number,
  ) => {
    setter(prev => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  };

  const featureTotal = customFeatures?.reduce((sum, f) => sum + f.price * (featureCounts[f.id] ?? 0), 0) ?? 0;
  const addonTotal = addons?.reduce((sum, a) => sum + a.price * (addonCounts[a.id] ?? 0), 0) ?? 0;
  const grandTotal = featureTotal + addonTotal;
  const meetsMinimum = grandTotal >= MINIMUM_ORDER;

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Wrench;
    return <Icon className="w-5 h-5" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetsMinimum) return;
    // Expand counts into repeated IDs for downstream use
    const featureIds = Object.entries(featureCounts).flatMap(([id, count]) => Array(count).fill(id));
    const addonIds = Object.entries(addonCounts).flatMap(([id, count]) => Array(count).fill(id));
    onSubmit(featureIds, addonIds, grandTotal);
  };

  const renderItem = (
    item: { id: string; name: string; description: string | null; icon: string; price: number },
    count: number,
    onIncrement: () => void,
    onDecrement: () => void,
    index: number,
  ) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
        count > 0
          ? 'border-secondary bg-secondary/5 shadow-soft'
          : 'border-border hover:border-muted-foreground/30'
      }`}
    >
      <span className="text-muted-foreground">{getIcon(item.icon)}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground">{item.name}</span>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-brand-teal">₹{item.price}</span>
        <div className="flex items-center gap-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={onDecrement}
            disabled={count === 0}
            className="p-1.5 rounded-l-lg hover:bg-muted-foreground/10 disabled:opacity-30 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-6 text-center text-sm font-semibold">{count}</span>
          <button
            type="button"
            onClick={onIncrement}
            className="p-1.5 rounded-r-lg hover:bg-muted-foreground/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const isLoading = addonsLoading || featuresLoading;
  const loadingPlaceholder = (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="bg-brand-light-blue rounded-xl p-4">
        <h3 className="font-semibold text-brand-navy">Build Your Service</h3>
        {categoryName && <p className="text-sm text-muted-foreground">{categoryName}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Pick the features and add-ons you need. Minimum order: <span className="font-semibold text-brand-teal">₹{MINIMUM_ORDER}</span>
        </p>
      </div>

      {customFeatures && customFeatures.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-1">🛠️ Features</h4>
          <p className="text-xs text-muted-foreground mb-4">Select the cleaning features you need.</p>
          {featuresLoading ? loadingPlaceholder : (
            <div className="space-y-3">
              {customFeatures.map((feature, index) =>
                renderItem(
                  { ...feature, icon: feature.icon ?? 'sparkles' },
                  featureCounts[feature.id] ?? 0,
                  () => updateCount(setFeatureCounts, feature.id, 1),
                  () => updateCount(setFeatureCounts, feature.id, -1),
                  index,
                )
              )}
            </div>
          )}
        </div>
      )}

      <div>
        <h4 className="font-semibold text-foreground mb-1">⚡ Add-on Services</h4>
        <p className="text-xs text-muted-foreground mb-4">Enhance your service with extras.</p>
        {addonsLoading ? loadingPlaceholder : (
          <div className="space-y-3">
            {addons?.map((addon, index) =>
              renderItem(
                { ...addon, icon: addon.icon ?? 'wrench' },
                addonCounts[addon.id] ?? 0,
                () => updateCount(setAddonCounts, addon.id, 1),
                () => updateCount(setAddonCounts, addon.id, -1),
                index,
              )
            )}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <motion.div layout className="bg-card border rounded-xl p-4 space-y-2 shadow-soft">
        <h4 className="font-semibold text-foreground text-sm mb-2">💰 Price Breakdown</h4>
        <AnimatePresence>
          {customFeatures?.filter(f => (featureCounts[f.id] ?? 0) > 0).map(feature => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1">
                {feature.name} × {featureCounts[feature.id]}
              </span>
              <span>₹{(feature.price * featureCounts[feature.id]).toLocaleString()}</span>
            </motion.div>
          ))}
          {addons?.filter(a => (addonCounts[a.id] ?? 0) > 0).map(addon => (
            <motion.div
              key={addon.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-between text-sm text-muted-foreground overflow-hidden"
            >
              <span className="flex items-center gap-1">
                {addon.name} × {addonCounts[addon.id]}
              </span>
              <span>₹{(addon.price * addonCounts[addon.id]).toLocaleString()}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {grandTotal === 0 && (
          <p className="text-sm text-muted-foreground italic">No items selected yet</p>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-semibold">Total</span>
          <motion.span
            key={grandTotal}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold ${meetsMinimum ? 'text-brand-teal' : 'text-destructive'}`}
          >
            ₹{grandTotal.toLocaleString()}
          </motion.span>
        </div>

        {!meetsMinimum && grandTotal > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-destructive mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Add ₹{(MINIMUM_ORDER - grandTotal).toLocaleString()} more to reach the minimum order of ₹{MINIMUM_ORDER}</span>
          </motion.div>
        )}
      </motion.div>

      <Button
        type="submit"
        variant="hero"
        size="xl"
        className="w-full"
        disabled={!meetsMinimum || isLoading}
      >
        {!meetsMinimum
          ? `Minimum ₹${MINIMUM_ORDER} required`
          : 'Continue to Booking'}
      </Button>
    </motion.form>
  );
}
