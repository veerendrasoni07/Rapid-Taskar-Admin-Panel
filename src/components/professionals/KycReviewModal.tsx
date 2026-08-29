import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminServices';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import PromptModal from '../common/PromptModal';
import { CheckCircle2, XCircle, ExternalLink, FileText, ShieldAlert, Image as ImageIcon } from 'lucide-react';

interface KycReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string | null;
}

export default function KycReviewModal({ isOpen, onClose, professionalId }: KycReviewModalProps) {
  const queryClient = useQueryClient();
  const [rejectingTarget, setRejectingTarget] = useState<{ id: string; isBulk: boolean } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['professionalDetails', professionalId],
    queryFn: () => (professionalId ? adminService.getProfessionalById(professionalId) : null),
    enabled: !!professionalId && isOpen,
  });

  const updateKycMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminService.updateKycStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      queryClient.invalidateQueries({ queryKey: ['professionalDetails', professionalId] });
      refetch();
    },
  });

  if (!isOpen || !professionalId) return null;

  const pro = data?.data?.professional;
  const documents = data?.data?.documents || [];

  const handleApprove = (id: string) => {
    updateKycMutation.mutate({ id, status: 'APPROVED' });
  };

  const handleRejectPrompt = (id: string, isBulk = false) => {
    setRejectingTarget({ id, isBulk });
  };

  const handleConfirmReject = (reason: string) => {
    if (!rejectingTarget) return;
    updateKycMutation.mutate({
      id: rejectingTarget.id,
      status: 'REJECTED',
      reason,
    });
    setRejectingTarget(null);
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null || url.includes('firebasestorage') || url.includes('alt=media');
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="KYC Verification & Document Review">
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="py-12 text-center text-secondary font-medium">Loading professional documents...</div>
          ) : !pro ? (
            <div className="py-8 text-center text-secondary">Professional information not found.</div>
          ) : (
            <>
              {/* Header Info */}
              <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-text">{pro.user?.name || 'Unknown Professional'}</h3>
                  <p className="text-sm text-secondary">{pro.user?.phone} | {pro.user?.email || 'No Email'}</p>
                  <p className="text-xs text-secondary mt-1">Submitted Date: {new Date(pro.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-secondary block font-medium">Overall KYC Status</span>
                    <StatusBadge status={pro.kycStatus || 'NOT_SUBMITTED'} />
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-border">
                <span className="text-sm font-semibold text-text">Actions for all documents:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(pro._id)}
                    disabled={updateKycMutation.isPending}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve All KYC
                  </button>
                  <button
                    onClick={() => handleRejectPrompt(pro._id, true)}
                    disabled={updateKycMutation.isPending}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject All KYC
                  </button>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-secondary">
                  Uploaded Documents ({documents.length})
                </h4>

                {documents.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-border rounded-lg">
                    <ShieldAlert className="w-10 h-10 text-warning mx-auto mb-2" />
                    <p className="text-sm font-medium text-text">No documents uploaded yet</p>
                    <p className="text-xs text-secondary mt-1">The partner has not submitted any KYC files to Firebase Storage.</p>
                  </div>
                ) : (
                  documents.map((doc: any) => (
                    <div key={doc._id} className="border border-border rounded-lg p-4 bg-surface space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="font-bold text-text text-base">
                            {doc.documentType.replace('_', ' ')}
                          </span>
                          <StatusBadge status={doc.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View / Download Document
                          </a>
                        </div>
                      </div>

                      {doc.rejectionReason && (
                        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-md text-xs font-medium border border-rose-200 dark:border-rose-900/30">
                          Rejection Reason: {doc.rejectionReason}
                        </div>
                      )}

                      {/* File Preview */}
                      <div className="relative group bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-border max-h-64 flex items-center justify-center p-2">
                        {isImage(doc.documentUrl) ? (
                          <img
                            src={doc.documentUrl}
                            alt={doc.documentType}
                            className="max-h-56 object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setPreviewImage(doc.documentUrl)}
                          />
                        ) : (
                          <div className="p-6 text-center">
                            <ImageIcon className="w-12 h-12 text-secondary mx-auto mb-2" />
                            <p className="text-xs text-secondary">Document Preview Available</p>
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90"
                            >
                              Open Document
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Document Actions */}
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => handleApprove(doc._id)}
                          disabled={updateKycMutation.isPending || doc.status === 'APPROVED'}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve This Document
                        </button>
                        <button
                          onClick={() => handleRejectPrompt(doc._id)}
                          disabled={updateKycMutation.isPending || doc.status === 'REJECTED'}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:bg-rose-950/30 dark:text-rose-400 rounded text-xs font-semibold flex items-center gap-1 border border-rose-200 dark:border-rose-800 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject This Document
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Rejection Prompt Modal */}
      <PromptModal
        isOpen={!!rejectingTarget}
        onClose={() => setRejectingTarget(null)}
        onSubmit={handleConfirmReject}
        title="Specify KYC Rejection Reason"
        message="Please provide a clear reason for rejecting the KYC document so the partner can re-upload correctly:"
        placeholder="e.g. Document image is blurry, name does not match, expired document"
        submitText="Confirm Rejection"
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-lg">
            <img src={previewImage} alt="KYC Full Preview" className="max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 hover:bg-black/90"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
