'use client'

import { motion, type Variants } from 'framer-motion'
import { Users, Calendar, Trophy, Award } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '10K+',
    label: 'Atletas Cadastrados',
    color: 'from-primary-blue to-primary-accent',
  },
  {
    icon: Calendar,
    value: '500+',
    label: 'Eventos Realizados',
    color: 'from-primary-accent to-primary-blue',
  },
  {
    icon: Trophy,
    value: '50+',
    label: 'Campeonatos',
    color: 'from-primary-blue to-primary-accent',
  },
  {
    icon: Award,
    value: '100+',
    label: 'Academias Parceiras',
    color: 'from-primary-accent to-primary-blue',
  },
]

export default function StatsSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <section className="py-20 border-t border-gray-200 bg-gradient-to-b from-blue-50/50 to-transparent">
      <div className="container mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-blue/20 to-primary-accent/20 group-hover:from-primary-blue/30 group-hover:to-primary-accent/30 transition-all duration-300">
                  <Icon size={32} className="text-primary-blue" />
                </div>
                <motion.div
                  className={`text-4xl md:text-5xl font-display font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1 + 0.3,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-xs uppercase tracking-widest text-gray-600 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
