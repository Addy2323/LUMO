import { prisma } from '../lib/db'

const alibabaImages = [
  'https://sc04.alicdn.com/kf/H19d43b6a95d049ffa29300e27ee63da7k.jpg',
  'https://sc04.alicdn.com/kf/H76419a4869714aa9a46b023bb3d99356k.jpg',
  'https://sc04.alicdn.com/kf/Hcdda8fcecfef40e6b444d8c766a9b379l.jpg',
  'https://sc04.alicdn.com/kf/H07f8e8c8251a4140b5a63bd56ed0db51T.jpg',
  'https://sc04.alicdn.com/kf/Hc89c23ad67514183baa6f0dd75194620o.jpg',
  'https://sc04.alicdn.com/kf/H05128427f897442b8fd087535dc399ccv.jpg',
  'https://sc04.alicdn.com/kf/H16da25c4efac42a79ee8c2ea4c45d4ccQ.jpg',
  'https://sc04.alicdn.com/kf/H5cf87cfd9d03420eb2e543e2dc9c74a8Y.jpg',
  'https://sc04.alicdn.com/kf/H11f10eda665c49c79af48cffd45a05eaA.jpg',
  'https://sc04.alicdn.com/kf/H2f846b5d83704058a43eb1a2d5ede59ek.jpg',
]

async function main() {
  console.log('Updating all chair products in PostgreSQL Database with exact Alibaba image URLs...')

  const prods = await prisma.product.findMany()
  const chairs = prods.filter(p => {
    const t = p.title.toLowerCase()
    return t.includes('chair') || t.includes('stool') || t.includes('desk') || t.includes('sofa')
  })

  console.log(`Found ${chairs.length} chair products in DB. Updating images...`)

  for (let i = 0; i < chairs.length; i++) {
    const imgUrl = alibabaImages[i % alibabaImages.length]
    await prisma.product.update({
      where: { id: chairs[i].id },
      data: {
        imageUrl: imgUrl,
        status: 'PUBLISHED',
        isApproved: true,
      },
    })
  }

  console.log('Successfully updated all chair product images in DB!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
