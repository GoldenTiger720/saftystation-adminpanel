"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Download,
  Video,
  BookOpen,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

interface TrainingContent {
  id: string;
  contentType: "training_videos" | "work_instructions" | "documents";
  title: string;
  description: string | null;
  linkUrl: string | null;
  pdfData: string | null;
  pdfFilename: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrainingDevelopmentManagementProps {
  className?: string;
}

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB limit for PDF files

const contentTypeLabels: Record<string, string> = {
  training_videos: "Training Videos",
  work_instructions: "Work Instructions",
  documents: "Documents",
};

const contentTypeIcons: Record<string, React.ReactNode> = {
  training_videos: <Video className="h-4 w-4" />,
  work_instructions: <BookOpen className="h-4 w-4" />,
  documents: <FileText className="h-4 w-4" />,
};

const TrainingDevelopmentManagement: React.FC<TrainingDevelopmentManagementProps> = ({ className }) => {
  const [contents, setContents] = useState<TrainingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingContent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("training_videos");

  const [formData, setFormData] = useState({
    contentType: "training_videos" as "training_videos" | "work_instructions" | "documents",
    title: "",
    description: "",
    linkUrl: "",
    pdfData: "",
    pdfFilename: "",
    displayOrder: 0,
  });

  const { toast } = useToast();

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/training-content");
      if (!response.ok) throw new Error("Failed to fetch training content");
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error("Error fetching training content:", error);
      toast({
        title: "Error",
        description: "Failed to fetch training content from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleFileToBase64 = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > maxSize) {
        reject(new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf"];
    const hasValidExtension = file.name.toLowerCase().endsWith(".pdf");

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: "Error",
        description: "Please select a PDF file (.pdf)",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await handleFileToBase64(file, MAX_PDF_SIZE);
      setFormData((prev) => ({
        ...prev,
        pdfData: base64,
        pdfFilename: file.name,
      }));
      toast({
        title: "Success",
        description: "PDF file uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading PDF file:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload PDF file",
        variant: "destructive",
      });
    }

    event.target.value = "";
  };

  const clearPdf = () => {
    setFormData((prev) => ({ ...prev, pdfData: "", pdfFilename: "" }));
  };

  const filteredContents = contents.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.isActive) ||
      (filterStatus === "inactive" && !item.isActive);
    const matchesTab = item.contentType === activeTab;
    return matchesSearch && matchesStatus && matchesTab;
  });

  const handleCreateContent = async () => {
    if (!formData.contentType || !formData.title) {
      toast({
        title: "Error",
        description: "Please fill in content type and title",
        variant: "destructive",
      });
      return;
    }

    // Validate based on content type
    if (formData.contentType === "work_instructions" && !formData.pdfData) {
      toast({
        title: "Error",
        description: "Please upload a PDF file for Work Instructions",
        variant: "destructive",
      });
      return;
    }

    if ((formData.contentType === "training_videos" || formData.contentType === "documents") && !formData.linkUrl) {
      toast({
        title: "Error",
        description: "Please provide a SharePoint link",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/training-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: formData.contentType,
          title: formData.title,
          description: formData.description || null,
          linkUrl: formData.linkUrl || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
          displayOrder: formData.displayOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create training content");
      }

      toast({
        title: "Success",
        description: "Training content created successfully",
      });

      resetForm();
      setIsCreateDialogOpen(false);
      fetchContents();
    } catch (error) {
      console.error("Error creating training content:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create training content",
        variant: "destructive",
      });
    }
  };

  const handleEditContent = async () => {
    if (!editingItem) return;

    if (!formData.contentType || !formData.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/training-content/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: formData.contentType,
          title: formData.title,
          description: formData.description || null,
          linkUrl: formData.linkUrl || null,
          pdfData: formData.pdfData || null,
          pdfFilename: formData.pdfFilename || null,
          displayOrder: formData.displayOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update training content");
      }

      toast({
        title: "Success",
        description: "Training content updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchContents();
    } catch (error) {
      console.error("Error updating training content:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update training content",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      const response = await fetch(`/api/training-content/${contentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete training content");

      toast({
        title: "Success",
        description: "Training content deleted successfully",
      });

      fetchContents();
    } catch (error) {
      console.error("Error deleting training content:", error);
      toast({
        title: "Error",
        description: "Failed to delete training content",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (contentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/training-content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `Content ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchContents();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update content status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      contentType: activeTab as "training_videos" | "work_instructions" | "documents",
      title: "",
      description: "",
      linkUrl: "",
      pdfData: "",
      pdfFilename: "",
      displayOrder: 0,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      contentType: activeTab as "training_videos" | "work_instructions" | "documents",
    }));
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: TrainingContent) => {
    setEditingItem(item);
    setFormData({
      contentType: item.contentType,
      title: item.title,
      description: item.description || "",
      linkUrl: item.linkUrl || "",
      pdfData: item.pdfData || "",
      pdfFilename: item.pdfFilename || "",
      displayOrder: item.displayOrder,
    });
    setIsEditDialogOpen(true);
  };

  const contentStats = {
    total: contents.length,
    active: contents.filter((item) => item.isActive).length,
    inactive: contents.filter((item) => !item.isActive).length,
    byType: {
      training_videos: contents.filter((item) => item.contentType === "training_videos").length,
      work_instructions: contents.filter((item) => item.contentType === "work_instructions").length,
      documents: contents.filter((item) => item.contentType === "documents").length,
    },
  };

  const renderFormContent = (prefix: string) => (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor={`${prefix}-contentType`}>Content Type *</Label>
        <Select
          value={formData.contentType}
          onValueChange={(value: "training_videos" | "work_instructions" | "documents") =>
            setFormData((prev) => ({ ...prev, contentType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select content type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="training_videos">Training Videos</SelectItem>
            <SelectItem value="work_instructions">Work Instructions</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor={`${prefix}-title`}>Title *</Label>
        <Input
          id={`${prefix}-title`}
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Enter title"
        />
      </div>

      <div>
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Textarea
          id={`${prefix}-description`}
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter description"
        />
      </div>

      {/* Show link input for training_videos and documents */}
      {(formData.contentType === "training_videos" || formData.contentType === "documents") && (
        <div>
          <Label htmlFor={`${prefix}-linkUrl`}>
            <LinkIcon className="inline h-4 w-4 mr-1" />
            SharePoint Link *
          </Label>
          <Input
            id={`${prefix}-linkUrl`}
            value={formData.linkUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="https://sharepoint.com/..."
          />
        </div>
      )}

      {/* Show PDF upload for work_instructions */}
      {formData.contentType === "work_instructions" && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-pdf`}>
            <FileText className="inline h-4 w-4 mr-1" />
            PDF File *
          </Label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                id={`${prefix}-pdf`}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {formData.pdfData && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearPdf}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {formData.pdfFilename && (
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <FileText className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">{formData.pdfFilename}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Max size: {MAX_PDF_SIZE / 1024 / 1024}MB. Supported: .pdf
            </p>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor={`${prefix}-displayOrder`}>Display Order</Label>
        <Input
          id={`${prefix}-displayOrder`}
          type="number"
          min={0}
          value={formData.displayOrder}
          onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Training & Development Management</h2>
          <p className="text-muted-foreground">
            Manage training videos, work instructions, and documents
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchContents} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.inactive}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.byType.training_videos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Inst.</CardTitle>
            <BookOpen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.byType.work_instructions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentStats.byType.documents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Content Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training_videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Training Videos
          </TabsTrigger>
          <TabsTrigger value="work_instructions" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Work Instructions
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {["training_videos", "work_instructions", "documents"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by title or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={filterStatus === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === "active" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("active")}
                    >
                      Active
                    </Button>
                    <Button
                      variant={filterStatus === "inactive" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus("inactive")}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {contentTypeIcons[tabValue]}
                  {contentTypeLabels[tabValue]} ({filteredContents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredContents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No content found. Click &quot;Add Content&quot; to create one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>{tabValue === "work_instructions" ? "PDF File" : "Link"}</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContents.map((content) => (
                          <TableRow key={content.id}>
                            <TableCell>
                              <Badge variant="outline">{content.displayOrder}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{content.title}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {content.description || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {content.contentType === "work_instructions" ? (
                                content.pdfData ? (
                                  <a
                                    href={content.pdfData}
                                    download={content.pdfFilename || "document.pdf"}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                  >
                                    <Download className="h-4 w-4" />
                                    {content.pdfFilename || "Download"}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No file</span>
                                )
                              ) : content.linkUrl ? (
                                <a
                                  href={content.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open Link
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-sm">No link</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={content.isActive}
                                  onCheckedChange={() => handleToggleStatus(content.id, content.isActive)}
                                />
                                <Badge
                                  className={
                                    content.isActive
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                  }
                                >
                                  {content.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(content)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &quot;{content.title}&quot;? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteContent(content.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Training Content</DialogTitle>
            <DialogDescription>
              Add new training videos, work instructions, or documents.
            </DialogDescription>
          </DialogHeader>
          {renderFormContent("create")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContent}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Content</DialogTitle>
            <DialogDescription>
              Update the training content information.
            </DialogDescription>
          </DialogHeader>
          {renderFormContent("edit")}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditContent}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingDevelopmentManagement;
