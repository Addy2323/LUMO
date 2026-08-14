'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight, Folder, FolderPlus, Layers, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type CategoryNode = {
  id: string
  name: string
  slug: string
  description: string
  children?: CategoryNode[]
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'c1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Consumer electronics, smartphones, audio equipment and smart devices.',
    children: [
      { id: 'c1-1', name: 'Audio & Headphones', slug: 'electronics-audio', description: 'Wireless earbuds and headphones.' },
      { id: 'c1-2', name: 'Mobile Accessories', slug: 'electronics-mobile-accessories', description: 'Cases, chargers, cables.' },
      { id: 'c1-3', name: 'Computer Accessories', slug: 'electronics-computer-accessories', description: 'Keyboards, mice, webcams.' },
      { id: 'c1-4', name: 'Smart Devices', slug: 'electronics-smart-devices', description: 'Smartwatches and home automation.' },
    ],
  },
  {
    id: 'c2',
    name: "Men's Fashion",
    slug: 'mens-fashion',
    description: 'Men apparel, footwear, tailoring, and lifestyle accessories.',
    children: [
      { id: 'c2-1', name: "Men's Shirts", slug: 'mens-shirts', description: 'Formal dress shirts and polo shirts.' },
      { id: 'c2-2', name: "Men's Trousers", slug: 'mens-trousers', description: 'Chinos, jeans, and suit pants.' },
      { id: 'c2-3', name: "Men's Shoes", slug: 'mens-shoes', description: 'Leather oxfords, sneakers, boots.' },
    ],
  },
  {
    id: 'c3',
    name: "Women's Fashion",
    slug: 'womens-fashion',
    description: 'Women dresses, tops, footwear, bags, and fashion accessories.',
    children: [
      { id: 'c3-1', name: "Women's Dresses", slug: 'womens-dresses', description: 'Evening gowns and summer dresses.' },
      { id: 'c3-2', name: "Women's Tops", slug: 'womens-tops', description: 'Blouses and t-shirts.' },
    ],
  },
  {
    id: 'c4',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Kitchen appliances, cookware, home furniture, storage and lighting.',
    children: [
      { id: 'c4-1', name: 'Kitchen & Dining', slug: 'kitchen-dining', description: 'Blenders, air fryers, cookware.' },
      { id: 'c4-2', name: 'Lighting', slug: 'home-lighting', description: 'LED ceiling lights and solar lamps.' },
    ],
  },
  {
    id: 'c5',
    name: 'Beauty & Accessories',
    slug: 'beauty-accessories',
    description: 'Personal care appliances, luxury bags, fine jewelry, and cosmetics.',
    children: [
      { id: 'c5-1', name: 'Personal Care', slug: 'beauty-personal-care', description: 'Hair dryers and shavers.' },
      { id: 'c5-2', name: 'Bags & Luggage', slug: 'beauty-bags', description: 'Handbags and leather backpacks.' },
    ],
  },
]

export default function CategoryManagerPage() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['c1', 'c2', 'c3', 'c4', 'c5']))
  const [newCatName, setNewCatName] = useState('')

  function toggleNode(id: string) {
    const next = new Set(expandedNodes)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedNodes(next)
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/admin/catalog" />}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Hierarchical Category Manager</h1>
            <p className="text-xs text-muted-foreground">Manage top-level departments, subcategories, and catalog classification rules.</p>
          </div>
        </div>

        <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1">
          <Plus className="size-3.5" /> Add Top Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Layers className="size-4 text-brand-600" />
            Marketplace Category Tree Structure
          </CardTitle>
          <CardDescription className="text-xs">
            Subcategories inherit parent attributes. Bulk imports map automatically against these category slugs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md divide-y">
            {CATEGORY_TREE.map((cat) => {
              const isExpanded = expandedNodes.has(cat.id)
              return (
                <div key={cat.id} className="p-3 text-xs">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleNode(cat.id)}>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                      <Folder className="size-4 text-brand-600" />
                      <span className="font-bold text-foreground text-sm">{cat.name}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {cat.slug}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px]">{cat.children?.length || 0} Subcategories</span>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-brand-600">
                        + Subcategory
                      </Button>
                    </div>
                  </div>

                  {isExpanded && cat.children ? (
                    <div className="ml-6 mt-2 space-y-1.5 border-l pl-3">
                      {cat.children.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between py-1 hover:bg-muted/30 px-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span className="font-semibold text-foreground">{sub.name}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">({sub.slug})</span>
                          </div>

                          <span className="text-muted-foreground text-[11px] truncate max-w-xs">{sub.description}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
