import React, { useState, useMemo } from "react";
import {
  useFamilyMembers,
  useAddFamilyMemberWithInvite,
  useUpdateFamilyMember,
  useUpdateMemberRole,
  useDeleteFamilyMember,
  useRegenerateInviteCode,
  useIsAdmin,
  useMyMember,
  useMyFamily,
  useChores,
  useMoodEntries,
  useCalendarEvents,
} from "../hooks/useQueries";
import type { FamilyMember } from "../backend";
import { COLORS, AVATARS } from "../constants";
import { LoadingScreen } from "./LoadingScreen";
import { Toast } from "./shared/Toast";
import { Modal } from "./shared/Modal";
import { ConfirmDialog } from "./shared/ConfirmDialog";
import { FormButton } from "./shared/FormButton";
import { MemberAvatar } from "./shared/MemberAvatar";
import { PageCard } from "./shared/PageCard";
import { EmptyState } from "./shared/EmptyState";
import { DataTable, DataTableColumn } from "./shared/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Users,
  Copy,
  Check,
  X,
  UserPlus,
  Link,
  UserCheck,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getMemberStats } from "../utils/dataHelpers";

export const FamilyPage: React.FC = () => {
  const { data: members = [], isLoading, error, refetch } = useFamilyMembers();
  const { data: isAdmin } = useIsAdmin();
  const { data: myMember } = useMyMember();
  const { data: myFamily } = useMyFamily();
  const { data: chores = [] } = useChores();
  const { data: moods = [] } = useMoodEntries();
  const { data: events = [] } = useCalendarEvents();

  const addMemberWithInvite = useAddFamilyMemberWithInvite();
  const updateMember = useUpdateFamilyMember();
  const updateRole = useUpdateMemberRole();
  const deleteMember = useDeleteFamilyMember();
  const regenerateCode = useRegenerateInviteCode();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: COLORS[0],
    avatarEmoji: AVATARS[0],
    role: "member" as "admin" | "member",
  });
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FamilyMember | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage({ message, type });
  };

  const copyToClipboard = async (code: string | undefined) => {
    if (!code) {
      return showToast("Invite code not found", "error");
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      showToast("Failed to copy code", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await updateMember.mutateAsync({
          id: editingMember.id,
          name: formData.name,
          color: formData.color,
          avatarEmoji: formData.avatarEmoji,
        });

        const canEditRole =
          isAdmin && myMember && editingMember.id !== myMember.id;
        if (canEditRole && formData.role !== editingMember.role) {
          await updateRole.mutateAsync({
            id: editingMember.id,
            role: formData.role,
          });
        }

        showToast("Family member updated successfully!", "success");
        setShowForm(false);
      } else {
        const result = await addMemberWithInvite.mutateAsync(formData);
        setNewInviteCode(result.inviteCode);
        showToast(
          "Family member added! Share the invite code with them.",
          "success",
        );
      }
      setEditingMember(null);
      setFormData({
        name: "",
        color: COLORS[0],
        avatarEmoji: AVATARS[0],
        role: "member",
      });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "An error occurred",
        "error",
      );
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      color: member.color,
      avatarEmoji: member.avatarEmoji,
      role: member.role as "admin" | "member",
    });
    setShowForm(true);
    setNewInviteCode(null);
  };

  const handleDeleteClick = (member: FamilyMember) => {
    if (member.role === "admin") {
      showToast("Cannot remove the admin member.", "error");
      return;
    }
    setDeleteTarget(member);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteMember.mutateAsync(deleteTarget.id);
        showToast("Family member removed successfully!", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Failed to remove member",
          "error",
        );
      }
    }
  };

  const handleRegenerateCode = async (member: FamilyMember) => {
    try {
      const newCode = await regenerateCode.mutateAsync(member.id);
      showToast(`New invite code for ${member.name}: ${newCode}`, "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to regenerate code",
        "error",
      );
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={<X className="w-12 h-12 text-red-400" />}
        title="Failed to load family members"
        description="Please try again"
        action={{
          label: "Try Again",
          onClick: () => refetch(),
        }}
      />
    );
  }

  const isFormLoading =
    addMemberWithInvite.isPending ||
    updateMember.isPending ||
    updateRole.isPending;

  // Table columns
  const tableColumns: DataTableColumn<FamilyMember>[] = [
    {
      key: "avatar",
      label: "",
      render: (member) => <MemberAvatar member={member} size="md" />,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (member) => (
        <div>
          <div className="font-light text-brand-gray-800">
            {member.name}
            {myMember && member.id === myMember.id && (
              <Badge className="ml-2 text-xs">You</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      filterable: true,
      render: (member) => (
        <Badge
          variant={member.role === "admin" ? "default" : "secondary"}
          className="capitalize"
        >
          {member.role}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (member) => (
        <Badge
          variant="outline"
          className={
            member.isLinked
              ? "border-green-500/40 text-green-600"
              : "border-yellow-500/40 text-yellow-600"
          }
        >
          {member.isLinked ? "Linked" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (member) => (
        <div className="flex gap-2 justify-end">
          {(isAdmin || (myMember && member.id === myMember.id)) && (
            <FormButton
              onClick={() => handleEdit(member)}
              variant="secondary"
              className="text-xs"
            >
              Edit
            </FormButton>
          )}
          {isAdmin && member.role !== "admin" && (
            <FormButton
              onClick={() => handleDeleteClick(member)}
              disabled={deleteMember.isPending}
              variant="secondary"
              className="text-xs text-red-600"
            >
              Remove
            </FormButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toast
        message={toastMessage?.message || ""}
        type={toastMessage?.type || "success"}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-brand-gray-800">
          Family Members
        </h2>
        {myFamily && (
          <p className="text-sm text-brand-gray-500 mt-1">
            {myFamily.name} • {members.length} member
            {members.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* View Toggle & Add Button */}
      <div className="flex items-center justify-between">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "grid" | "table")}
        >
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
        </Tabs>

        {isAdmin && (
          <FormButton
            onClick={() => {
              setEditingMember(null);
              setFormData({
                name: "",
                color: COLORS[0],
                avatarEmoji: AVATARS[0],
                role: "member",
              });
              setShowForm(true);
              setNewInviteCode(null);
            }}
            variant="primary"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </FormButton>
        )}
      </div>

      {/* Content Views */}
      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-brand-primary-500" />}
          title="No family members yet"
          description="Add family members and invite them to join!"
        />
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const isCurrentUser = myMember && member.id === myMember.id;
            const memberStats = getMemberStats(
              member.id,
              chores,
              moods,
              events,
            );

            return (
              <HoverCard key={member.id.toString()}>
                <HoverCardTrigger asChild>
                  <PageCard
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 ${
                      isCurrentUser ? "ring-2 ring-brand-primary-500/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <MemberAvatar member={member} size="lg" />
                      <div className="flex-1">
                        <h3 className="font-light text-brand-gray-800">
                          {member.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <Badge
                            variant="secondary"
                            className="text-xs font-light capitalize"
                          >
                            {member.role}
                          </Badge>
                          {isCurrentUser && (
                            <Badge className="text-xs font-light">You</Badge>
                          )}
                          {member.isLinked ? (
                            <Badge
                              variant="outline"
                              className="text-xs font-light border-green-500/40 text-green-600"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Linked
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs font-light border-yellow-500/40 text-yellow-600"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Invite Code Section */}
                    {isAdmin &&
                      !member.isLinked &&
                      member.inviteCode &&
                      member.inviteCode.length > 0 &&
                      member.inviteCode[0] && (
                        <div className="mt-4 p-3 bg-brand-gray-100/30 rounded-lg">
                          <div className="text-xs text-brand-gray-500 font-extralight mb-1">
                            Invite Code
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-sm text-brand-gray-800 font-light tracking-wider">
                              {member.inviteCode}
                            </code>
                            <FormButton
                              onClick={() => copyToClipboard(member.inviteCode)}
                              variant="secondary"
                              className="text-xs"
                            >
                              {copiedCode === member.inviteCode[0] ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </FormButton>
                          </div>
                        </div>
                      )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      {(isAdmin || isCurrentUser) && (
                        <FormButton
                          onClick={() => handleEdit(member)}
                          variant="secondary"
                          className="flex-1 text-sm"
                        >
                          Edit
                        </FormButton>
                      )}
                      {isAdmin &&
                        !member.isLinked &&
                        member.role !== "admin" && (
                          <FormButton
                            onClick={() => handleRegenerateCode(member)}
                            disabled={regenerateCode.isPending}
                            loading={regenerateCode.isPending}
                            variant="secondary"
                            className="text-sm"
                          >
                            New Code
                          </FormButton>
                        )}
                      {isAdmin && member.role !== "admin" && (
                        <FormButton
                          onClick={() => handleDeleteClick(member)}
                          disabled={deleteMember.isPending}
                          loading={deleteMember.isPending}
                          variant="secondary"
                          className="text-sm text-red-600"
                        >
                          Remove
                        </FormButton>
                      )}
                    </div>
                  </PageCard>
                </HoverCardTrigger>
                <HoverCardContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-light text-brand-gray-800">
                      {member.name}'s Activity
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-brand-gray-500">Chores:</span>
                        <span className="font-light text-brand-gray-800">
                          {memberStats.choresCompleted}/
                          {memberStats.choresAssigned}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-gray-500">
                          Recent mood:
                        </span>
                        <span className="text-xl">
                          {memberStats.recentMood || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-gray-500">
                          Upcoming events:
                        </span>
                        <span className="font-light text-brand-gray-800">
                          {memberStats.upcomingEvents}
                        </span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <DataTable
          columns={tableColumns}
          data={members}
          getRowKey={(m) => m.id.toString()}
        />
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setNewInviteCode(null);
        }}
        title={
          newInviteCode
            ? "Member Added!"
            : editingMember
              ? "Edit Member"
              : "Add Family Member"
        }
      >
        {newInviteCode ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-brand-gray-600 font-light mb-6">
              Share this invite code with {formData.name || "them"} so they can
              join your family:
            </p>
            <div className="bg-brand-gray-100 rounded-xl p-6 mb-6">
              <div className="text-3xl font-mono tracking-widest text-brand-gray-800 font-light mb-4">
                {newInviteCode}
              </div>
              <FormButton
                onClick={() => copyToClipboard(newInviteCode)}
                variant="primary"
              >
                {copiedCode === newInviteCode ? (
                  <>
                    <Check className="w-4 h-4 mr-2" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" /> Copy Code
                  </>
                )}
              </FormButton>
            </div>
            <p className="text-sm text-brand-gray-500 font-extralight mb-6">
              They'll need to create an Internet Identity and enter this code to
              join.
            </p>
            <FormButton
              onClick={() => {
                setShowForm(false);
                setNewInviteCode(null);
                setFormData({
                  name: "",
                  color: COLORS[0],
                  avatarEmoji: AVATARS[0],
                  role: "member",
                });
              }}
              variant="secondary"
              className="w-full"
            >
              Done
            </FormButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Name
              </Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Mom, Dad, Emma"
                className="bg-brand-gray-100 border-brand-gray-300 text-brand-gray-800 placeholder:text-brand-gray-400 font-light"
                required
              />
            </div>
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Avatar
              </Label>
              <div className="flex gap-2 flex-wrap">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, avatarEmoji: avatar })
                    }
                    className={`w-12 h-12 text-2xl rounded-lg border-2 transition-colors ${
                      formData.avatarEmoji === avatar
                        ? "border-brand-primary-500 bg-brand-primary-500/20"
                        : "border-brand-gray-300 hover:border-brand-gray-400"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-brand-gray-600 font-light mb-2">
                Color
              </Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-colors ${
                      formData.color === color
                        ? "border-brand-gray-800"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            {isAdmin &&
              editingMember &&
              myMember &&
              editingMember.id !== myMember.id && (
                <div>
                  <Label className="text-brand-gray-600 font-light mb-2">
                    Role
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: "member" })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors font-light ${
                        formData.role === "member"
                          ? "border-brand-primary-500 bg-brand-primary-500/20 text-brand-primary-500"
                          : "border-brand-gray-300 text-brand-gray-600 hover:border-brand-gray-400"
                      }`}
                    >
                      Member
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, role: "admin" })
                      }
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors font-light ${
                        formData.role === "admin"
                          ? "border-brand-primary-500 bg-brand-primary-500/20 text-brand-primary-500"
                          : "border-brand-gray-300 text-brand-gray-600 hover:border-brand-gray-400"
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                  <p className="text-xs text-brand-gray-500 font-extralight mt-1">
                    Admins can manage family members and settings.
                  </p>
                </div>
              )}
            {!editingMember && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-600 font-light">
                <strong className="font-light">Note:</strong> An invite code
                will be generated. Share it with this person so they can link
                their Internet Identity to join your family.
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <FormButton
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewInviteCode(null);
                }}
                variant="secondary"
              >
                Cancel
              </FormButton>
              <FormButton
                type="submit"
                disabled={isFormLoading || !formData.name.trim()}
                loading={isFormLoading}
                variant="primary"
              >
                {editingMember ? "Save" : "Add & Get Code"}
              </FormButton>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Family Member"
        description="Are you sure you want to remove this family member? This action cannot be undone."
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  );
};
