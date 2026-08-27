import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { Plus } from 'lucide-react';

export default function Categories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminService.getAllCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (newCategory: any) => adminService.createCategory(newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create category');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateCategory(editingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update category');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', image: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingId(category._id);
    setFormData({ 
      name: category.name || '', 
      description: category.description || '', 
      image: category.image || '' 
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', image: '' });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }
    
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns: Column<any>[] = [
    { header: 'Icon', cell: (item) => (
      item.image ? <img src={item.image} alt={item.name} className="w-8 h-8 rounded-full object-cover bg-background" /> : <div className="w-8 h-8 rounded-full bg-background" />
    )},
    { header: 'Category Name', accessorKey: 'name' },
    { header: 'Description', cell: (item) => item.description || 'N/A' },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> 
    },
    { 
      header: 'Created At', 
      cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <button 
            className="text-primary hover:text-primary/80 font-medium text-sm"
            onClick={() => openEditModal(item)}
          >
            Edit
          </button>
          <button 
            className="text-error hover:text-error/80 font-medium text-sm"
            onClick={() => setConfirmDeleteId(item._id)}
          >
            Deactivate
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Categories</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.categories || data?.data?.categories || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Category" : "Create New Category"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error/10 text-error rounded-md text-sm border border-error/20">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text mb-1">Category Name *</label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
              placeholder="e.g. Plumbing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm resize-none"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Image URL</label>
            <input 
              type="url"
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-text hover:bg-background rounded-md transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Category')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
        title="Deactivate Category"
        message="Are you sure you want to deactivate this category? It will no longer be visible to customers."
        confirmText="Deactivate"
        isDestructive={true}
      />
    </div>
  );
}
