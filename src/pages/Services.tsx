import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { Plus } from 'lucide-react';

export default function Services() {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmStatusItem, setConfirmStatusItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    category: '', 
    price: '', 
    duration: '', 
    image: '' 
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services', page],
    queryFn: () => adminService.getServices({ page })
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminService.getAllCategories(),
  });

  const categories = categoriesData?.categories || categoriesData?.data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (newService: any) => adminService.createService(newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create service');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedService: any) => adminService.updateService(editingId!, updatedService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update service');
    }
  });
  
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: boolean }) => adminService.updateServiceStatus(id, status ? 'true' : 'false'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', category: '', price: '', duration: '', image: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (service: any) => {
    setEditingId(service._id);
    setFormData({ 
      name: service.name || '', 
      description: service.description || '', 
      category: service.category || '', 
      price: service.price?.toString() || '', 
      duration: service.duration?.toString() || '', 
      image: service.image || '' 
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', category: '', price: '', duration: '', image: '' });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || !formData.duration) {
      setError('Please fill in all required fields');
      return;
    }
    
    const payload = {
      ...formData,
      price: Number(formData.price),
      duration: Number(formData.duration)
    };
    
    if (editingId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns: Column<any>[] = [
    { header: 'Service Name', accessorKey: 'name' },
    { 
      header: 'Category', 
      cell: (item) => {
        const cat = categories.find((c: any) => c._id === item.category);
        return cat ? cat.name : item.category || 'Uncategorized';
      } 
    },
    { 
      header: 'Base Price', 
      cell: (item) => `$${item.price?.toFixed(2) || '0.00'}` 
    },
    { header: 'Duration', cell: (item) => `${item.duration} mins` },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> 
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
            className={`${item.isActive ? 'text-error hover:text-error/80' : 'text-success hover:text-success/80'} font-medium text-sm`}
            onClick={() => setConfirmStatusItem(item)}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Services</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data?.services || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Service" : "Add New Service"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error/10 text-error rounded-md text-sm border border-error/20">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text mb-1">Service Name *</label>
            <input 
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
              placeholder="e.g. Deep Cleaning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Category *</label>
            <select 
              required
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
            >
              <option value="">Select a category</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Base Price ($) *</label>
              <input 
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
                placeholder="49.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Duration (mins) *</label>
              <input 
                type="number"
                min="1"
                required
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
                placeholder="60"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm resize-none"
              placeholder="What does this service include?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Image URL</label>
            <input 
              type="url"
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
              placeholder="https://example.com/service.png"
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
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Service')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmStatusItem}
        onClose={() => setConfirmStatusItem(null)}
        onConfirm={() => {
          if (confirmStatusItem) {
            statusMutation.mutate({ id: confirmStatusItem._id, status: !confirmStatusItem.isActive });
          }
        }}
        title={`${confirmStatusItem?.isActive ? 'Deactivate' : 'Activate'} Service`}
        message={`Are you sure you want to ${confirmStatusItem?.isActive ? 'deactivate' : 'activate'} ${confirmStatusItem?.name}?`}
        confirmText={confirmStatusItem?.isActive ? 'Deactivate' : 'Activate'}
        isDestructive={confirmStatusItem?.isActive}
      />
    </div>
  );
}
