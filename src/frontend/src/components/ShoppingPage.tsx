import React, { useState, useMemo } from "react";
import {
  useFamilyMembers,
  useShoppingItems,
  useCreateShoppingItem,
  useToggleShoppingItemComplete,
  useDeleteShoppingItem,
  useClearCompletedShoppingItems,
  useMyMember,
} from "../hooks/useQueries";
import type { ShoppingItem } from "../backend";
import { CATEGORIES } from "../constants";
import { LoadingScreen } from "./LoadingScreen";
import { Toast } from "./shared/Toast";
import { Modal } from "./shared/Modal";
import { FormButton } from "./shared/FormButton";
import { PageCard } from "./shared/PageCard";
import { MemberAvatar } from "./shared/MemberAvatar";
import { EmptyState } from "./shared/EmptyState";
import { ShoppingCart, CheckCircle2, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const ShoppingPage: React.FC = () => {
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers();
  const {
    data: items = [],
    isLoading: itemsLoading,
    error,
    refetch,
  } = useShoppingItems();
  const { data: myMember } = useMyMember();
  const createItem = useCreateShoppingItem();
  const toggleItem = useToggleShoppingItemComplete();
  const deleteItem = useDeleteShoppingItem();
  const clearCompleted = useClearCompletedShoppingItems();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    category: "Other",
  });
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myMember) return;
    try {
      await createItem.mutateAsync({
        name: formData.name,
        quantity: formData.quantity,
        category: formData.category,
        addedBy: myMember.id,
      });
      showToast("Item added to list!", "success");
      setShowForm(false);
      setFormData({
        name: "",
        quantity: "",
        category: "Other",
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add item",
        "error",
      );
    }
  };

  const handleToggle = async (itemId: bigint) => {
    try {
      await toggleItem.mutateAsync(itemId);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update item",
        "error",
      );
    }
  };

  const handleDelete = async (itemId: bigint) => {
    try {
      await deleteItem.mutateAsync(itemId);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete item",
        "error",
      );
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompleted.mutateAsync();
      showToast("Completed items cleared!", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to clear items",
        "error",
      );
    }
  };

  const activeItems = items.filter((i) => !i.isCompleted);
  const completedItems = items.filter((i) => i.isCompleted);

  // Group by category
  const itemsByCategory = activeItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, ShoppingItem[]>,
  );

  // Statistics
  const stats = useMemo(() => {
    const totalItems = items.length;
    const completedCount = completedItems.length;
    const activeCount = activeItems.length;
    const completionRate =
      totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

    // Items added this week (if we had timestamps, but we don't - so just use total for now)
    // This could be enhanced if we add createdAt to the backend
    const addedThisWeek = activeCount;

    return {
      totalActive: activeCount,
      completedCount,
      completionRate,
      addedThisWeek,
    };
  }, [items, activeItems, completedItems]);

  const isLoading = membersLoading || itemsLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<X className="w-12 h-12 text-red-400" />}
        title="Failed to load shopping list"
        description="Please try again"
        action={{
          label: "Try Again",
          onClick: () => refetch(),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      <Toast
        message={toastMessage?.message || ""}
        type={toastMessage?.type || "success"}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-light text-brand-gray-800">
            Shopping List
          </h2>
          <p className="text-sm text-brand-gray-500 mt-1">
            Track items you need to buy
          </p>
        </div>
        <div className="flex gap-2">
          {completedItems.length > 0 && (
            <FormButton
              onClick={handleClearCompleted}
              loading={clearCompleted.isPending}
              disabled={clearCompleted.isPending}
              variant="secondary"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Completed
            </FormButton>
          )}
          <FormButton onClick={() => setShowForm(true)} variant="primary">
            + Add Item
          </FormButton>
        </div>
      </div>

      {/* Overall Progress */}
      {items.length > 0 && (
        <PageCard
          title="Shopping Progress"
          subtitle={`${stats.completedCount} of ${items.length} items completed`}
        >
          <Progress value={stats.completionRate} className="h-3" />
        </PageCard>
      )}

      {/* Active Items by Category - Accordion */}
      {Object.keys(itemsByCategory).length > 0 && (
        <PageCard
          title="Items by Category"
          subtitle={`${Object.keys(itemsByCategory).length} categories`}
        >
          <Accordion
            type="multiple"
            defaultValue={Object.keys(itemsByCategory).slice(0, 3)}
            className="w-full"
          >
            {Object.entries(itemsByCategory).map(
              ([category, categoryItems]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-light text-brand-gray-800">
                        {category}
                      </span>
                      <Badge variant="secondary">{categoryItems.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {categoryItems.map((item) => {
                        const addedByMember = members.find(
                          (m) => m.id === item.addedBy,
                        );
                        return (
                          <div
                            key={item.id.toString()}
                            className="flex items-center gap-4 p-3 bg-brand-gray-100/30 rounded-lg border border-brand-gray-200"
                          >
                            <button
                              onClick={() => handleToggle(item.id)}
                              disabled={toggleItem.isPending}
                              className="w-6 h-6 rounded-full border-2 border-brand-primary-500 flex items-center justify-center hover:bg-brand-primary-500/20 disabled:opacity-50 transition-colors shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="font-light text-brand-gray-800">
                                {item.name}
                              </span>
                              {item.quantity && (
                                <span className="text-sm text-brand-gray-500 font-extralight ml-2">
                                  ({item.quantity})
                                </span>
                              )}
                            </div>
                            {addedByMember && (
                              <MemberAvatar member={addedByMember} size="xs" />
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deleteItem.isPending}
                              className="text-brand-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ),
            )}
          </Accordion>
        </PageCard>
      )}

      {activeItems.length === 0 && (
        <EmptyState
          icon={<ShoppingCart className="w-12 h-12 text-brand-primary-500" />}
          title="Shopping list is empty"
          description="Add items you need to buy!"
        />
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <PageCard
          title={`Completed (${completedItems.length})`}
          subtitle="Recently completed items"
        >
          <div className="space-y-2 opacity-60 max-h-48 overflow-y-auto">
            {completedItems.map((item) => (
              <div
                key={item.id.toString()}
                className="flex items-center gap-4 p-2"
              >
                <button
                  onClick={() => handleToggle(item.id)}
                  disabled={toggleItem.isPending}
                  className="w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center text-white text-sm disabled:opacity-50 shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <span className="flex-1 text-brand-gray-500 font-light line-through">
                  {item.name}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteItem.isPending}
                  className="text-brand-gray-500 hover:text-red-400 disabled:opacity-50 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </PageCard>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Add Item"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Item Name
            </Label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
              required
            />
          </div>
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Quantity (optional)
            </Label>
            <Input
              type="text"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              placeholder="e.g., 2 lbs, 1 gallon"
              className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
            />
          </div>
          <div>
            <Label className="text-brand-gray-600 font-light mb-2">
              Category
            </Label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 bg-brand-gray-100 border border-brand-gray-300 text-brand-gray-800 rounded-lg focus:ring-2 focus:ring-brand-primary-500 focus:border-transparent font-light"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-4">
            <FormButton
              type="button"
              onClick={() => setShowForm(false)}
              variant="secondary"
            >
              Cancel
            </FormButton>
            <FormButton
              type="submit"
              disabled={!myMember || !formData.name.trim()}
              loading={createItem.isPending}
              variant="primary"
            >
              Add Item
            </FormButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
