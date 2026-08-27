import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PromptModal from '../components/common/PromptModal';

export default function Pricing() {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [promptItem, setPromptItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['services_pricing', page],
    queryFn: () => adminService.getServices({ page }),
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string, price: number }) => adminService.updateService(id, { price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services_pricing'] });
    }
  });

  const handleUpdatePrice = (item: any) => {
    setPromptItem(item);
  };

  const columns: Column<any>[] = [
    { header: 'Service', accessorKey: 'name' },
    { 
      header: 'Category', 
      cell: (item) => item.category || 'Uncategorized' 
    },
    { 
      header: 'Base Price', 
      cell: (item) => <span className="font-semibold text-text">${item.price?.toFixed(2) || '0.00'}</span>
    },
    { header: 'Duration', cell: (item) => `${item.duration} mins` },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} /> 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button 
          className="text-primary hover:text-primary/80 font-medium text-sm"
          onClick={() => handleUpdatePrice(item)}
        >
          Update Price
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Pricing Management</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <p className="text-sm text-secondary">
          Manage base pricing for all services. Prices listed here are the default rates applied to new bookings. 
          Dynamic pricing rules (if applicable) are handled dynamically by the backend based on demand.
        </p>
      </div>

      <DataTable 
        columns={columns}
        data={data?.services || data?.data?.services || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <PromptModal
        isOpen={!!promptItem}
        onClose={() => setPromptItem(null)}
        onSubmit={(val) => {
          const newPrice = parseFloat(val);
          if (!isNaN(newPrice) && newPrice >= 0 && promptItem) {
            priceMutation.mutate({ id: promptItem._id, price: newPrice });
          } else {
            alert("Invalid price entered");
          }
        }}
        title="Update Base Price"
        message={`Enter new price for ${promptItem?.name}:`}
        defaultValue={promptItem?.price?.toString()}
        inputType="number"
        submitText="Update Price"
      />
    </div>
  );
}
