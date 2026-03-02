'use client';
import { useState } from 'react';
import { createProduct, updateProduct, deleteProduct } from '@/app/lib/actions';
import { Product } from '@/app/lib/definitions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
export default function AdminProducts({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const router = useRouter();
  const handleEdit = (product: Product) => {
    setEditingId(product.id!);
    setEditForm(product);
  };
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await deleteProduct(id);
    setProducts(products.filter(p => p.id !== id));
    router.refresh(); // optional: refresh server data
  };
  return (
    <div>
      <AddProductForm onProductAdded={(newProduct) => setProducts([...products, newProduct])} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow">
            <div className="relative h-40 w-full mb-2">
              <Image
                src={`/products/${product.image}`}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-gray-600 dark:text-gray-300">${product.price}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{product.type}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(product)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(product.id!)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Edit Modal */}
      {editingId && (
        <EditProductModal
          product={editForm as Product}
          onSave={async (updated) => {
            // updated is the result from updateProduct (already saved)
            setProducts(products.map(p => p.id === updated.id ? updated : p));
            setEditingId(null);
            router.refresh();
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
function AddProductForm({ onProductAdded }: { onProductAdded: (product: Product) => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('vegetables');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert('Please select an image');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('type', type);
    formData.append('image', imageFile);
    const newProduct = await createProduct(formData);
    if (newProduct) {
      onProductAdded(newProduct);
      setName('');
      setPrice('');
      setType('vegetables');
      setImageFile(null);
      router.refresh();
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-6">
      <h2 className="text-lg font-bold mb-4">Add New Product</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 border rounded dark:bg-gray-800"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="p-2 border rounded dark:bg-gray-800"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border rounded dark:bg-gray-800"
        >
          <option>vegetables</option>
          <option>meat</option>
          <option>soup</option>
        </select>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
          className="p-2"
        />
        <button type="submit" className="md:col-span-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Add Product
        </button>
      </div>
    </form>
  );
}
function EditProductModal({ product, onSave, onCancel }: { product: Product; onSave: (product: Product) => void; onCancel: () => void }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [type, setType] = useState(product.type);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('id', product.id!.toString());
    formData.append('name', name);
    formData.append('price', price);
    formData.append('type', type);
    if (imageFile) formData.append('image', imageFile);
    const updated = await updateProduct(formData);
    onSave(updated);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
            required
          />
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded mb-3 dark:bg-gray-700"
          >
            <option>vegetables</option>
            <option>meat</option>
            <option>soup</option>
          </select>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full mb-4"
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}