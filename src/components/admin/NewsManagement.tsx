"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Newspaper,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Image,
  User,
  Link,
  Briefcase,
  Upload,
  X,
} from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageData: string | null;
  avatarData: string | null;
  newsLink: string | null;
  posterName: string | null;
  posterTitle: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NewsManagementProps {
  className?: string;
}

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB limit for base64 images

const NewsManagement: React.FC<NewsManagementProps> = ({ className }) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageData: "",
    avatarData: "",
    newsLink: "",
    posterName: "",
    posterTitle: "",
  });

  const { toast } = useToast();

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/news-items");
      if (!response.ok) throw new Error("Failed to fetch news");
      const data = await response.json();
      setNewsItems(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({
        title: "Error",
        description: "Failed to fetch news from database",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_IMAGE_SIZE) {
        reject(new Error(`Image size must be less than ${MAX_IMAGE_SIZE / 1024}KB`));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: "imageData" | "avatarData"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await handleFileToBase64(file);
      setFormData((prev) => ({ ...prev, [field]: base64 }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const clearImage = (field: "imageData" | "avatarData") => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
  };

  const filteredNews = newsItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.isActive) ||
      (filterStatus === "inactive" && !item.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleCreateNews = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/news-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageData: formData.imageData || null,
          avatarData: formData.avatarData || null,
          newsLink: formData.newsLink || null,
          posterName: formData.posterName || null,
          posterTitle: formData.posterTitle || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create news");

      toast({
        title: "Success",
        description: "News item created successfully",
      });

      setFormData({
        title: "",
        description: "",
        imageData: "",
        avatarData: "",
        newsLink: "",
        posterName: "",
        posterTitle: "",
      });
      setIsCreateDialogOpen(false);
      fetchNews();
    } catch (error) {
      console.error("Error creating news:", error);
      toast({
        title: "Error",
        description: "Failed to create news item",
        variant: "destructive",
      });
    }
  };

  const handleEditNews = async () => {
    if (!editingItem) return;

    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in title and description",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/news-items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageData: formData.imageData || null,
          avatarData: formData.avatarData || null,
          newsLink: formData.newsLink || null,
          posterName: formData.posterName || null,
          posterTitle: formData.posterTitle || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update news");

      toast({
        title: "Success",
        description: "News item updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      setFormData({
        title: "",
        description: "",
        imageData: "",
        avatarData: "",
        newsLink: "",
        posterName: "",
        posterTitle: "",
      });
      fetchNews();
    } catch (error) {
      console.error("Error updating news:", error);
      toast({
        title: "Error",
        description: "Failed to update news item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    try {
      const response = await fetch(`/api/news-items/${newsId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete news");

      toast({
        title: "Success",
        description: "News item deleted successfully",
      });

      fetchNews();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Error",
        description: "Failed to delete news item",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (newsId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/news-items/${newsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: "Success",
        description: `News item ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchNews();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update news status",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setFormData({
      title: "",
      description: "",
      imageData: "",
      avatarData: "",
      newsLink: "",
      posterName: "",
      posterTitle: "",
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      imageData: item.imageData || "",
      avatarData: item.avatarData || "",
      newsLink: item.newsLink || "",
      posterName: item.posterName || "",
      posterTitle: item.posterTitle || "",
    });
    setIsEditDialogOpen(true);
  };

  const newsStats = {
    total: newsItems.length,
    active: newsItems.filter((item) => item.isActive).length,
    inactive: newsItems.filter((item) => !item.isActive).length,
  };

  const ImageUploadField = ({
    id,
    label,
    field,
    icon: Icon,
  }: {
    id: string;
    label: string;
    field: "imageData" | "avatarData";
    icon: typeof Image;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>
        <Icon className="inline h-4 w-4 mr-1" />
        {label}
      </Label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, field)}
            className="flex-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {formData[field] && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => clearImage(field)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {formData[field] && (
          <div
            className={`relative ${
              field === "avatarData" ? "w-16 h-16 rounded-full" : "w-32 h-24 rounded"
            } overflow-hidden bg-gray-100 border`}
          >
            <img
              src={formData[field]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Max size: {MAX_IMAGE_SIZE / 1024}KB. Supported: JPG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">News Management</h2>
          <p className="text-muted-foreground">
            Manage news items with images, avatars, and links
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNews} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4" />
                Add News
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New News Item</DialogTitle>
                <DialogDescription>
                  Add a new news item with title, description, image, avatar, and
                  link.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="create-title">Title *</Label>
                  <Input
                    id="create-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter news title"
                  />
                </div>

                <div>
                  <Label htmlFor="create-description">Description *</Label>
                  <Textarea
                    id="create-description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter news description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploadField
                    id="create-image"
                    label="News Image"
                    field="imageData"
                    icon={Upload}
                  />
                  <ImageUploadField
                    id="create-avatar"
                    label="Avatar Image"
                    field="avatarData"
                    icon={User}
                  />
                </div>

                <div>
                  <Label htmlFor="create-newsLink">
                    <Link className="inline h-4 w-4 mr-1" />
                    News Link
                  </Label>
                  <Input
                    id="create-newsLink"
                    value={formData.newsLink}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        newsLink: e.target.value,
                      }))
                    }
                    placeholder="https://example.com/full-article"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-posterName">
                      <User className="inline h-4 w-4 mr-1" />
                      Poster Name
                    </Label>
                    <Input
                      id="create-posterName"
                      value={formData.posterName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          posterName: e.target.value,
                        }))
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-posterTitle">
                      <Briefcase className="inline h-4 w-4 mr-1" />
                      Poster Title
                    </Label>
                    <Input
                      id="create-posterTitle"
                      value={formData.posterTitle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          posterTitle: e.target.value,
                        }))
                      }
                      placeholder="Safety Manager"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateNews}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* News Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsStats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsStats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search news by title or description..."
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

      {/* News Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            News Items ({filteredNews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No news items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>News</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Avatar</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNews.map((news) => (
                    <TableRow key={news.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium">{news.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {news.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {news.posterName ? (
                          <div className="text-sm">
                            <div className="font-medium">{news.posterName}</div>
                            {news.posterTitle && (
                              <div className="text-muted-foreground">
                                {news.posterTitle}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {news.imageData ? (
                          <div className="w-16 h-12 rounded overflow-hidden bg-gray-100">
                            <img
                              src={news.imageData}
                              alt={news.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No image
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {news.avatarData ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                            <img
                              src={news.avatarData}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No avatar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {news.newsLink ? (
                          <a
                            href={news.newsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Link
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No link
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={news.isActive}
                            onCheckedChange={() =>
                              handleToggleStatus(news.id, news.isActive)
                            }
                          />
                          <Badge
                            className={
                              news.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }
                          >
                            {news.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(news.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(news)}
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
                                <AlertDialogTitle>Delete News</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {news.title}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteNews(news.id)}
                                >
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit News Item</DialogTitle>
            <DialogDescription>
              Update the news item information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter news title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter news description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                id="edit-image"
                label="News Image"
                field="imageData"
                icon={Upload}
              />
              <ImageUploadField
                id="edit-avatar"
                label="Avatar Image"
                field="avatarData"
                icon={User}
              />
            </div>

            <div>
              <Label htmlFor="edit-newsLink">
                <Link className="inline h-4 w-4 mr-1" />
                News Link
              </Label>
              <Input
                id="edit-newsLink"
                value={formData.newsLink}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, newsLink: e.target.value }))
                }
                placeholder="https://example.com/full-article"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-posterName">
                  <User className="inline h-4 w-4 mr-1" />
                  Poster Name
                </Label>
                <Input
                  id="edit-posterName"
                  value={formData.posterName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      posterName: e.target.value,
                    }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="edit-posterTitle">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  Poster Title
                </Label>
                <Input
                  id="edit-posterTitle"
                  value={formData.posterTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      posterTitle: e.target.value,
                    }))
                  }
                  placeholder="Safety Manager"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditNews}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewsManagement;
