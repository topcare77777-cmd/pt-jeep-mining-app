useEffect(() => {
    let isMounted = true

    async function loadUserAndPermissions() {
      try {
        // 1. Tangkap access_token jika dilempar melalui URL hash (#access_token=...)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          const hashClean = window.location.hash.startsWith('#')
            ? window.location.hash.substring(1)
            : window.location.hash
          const hashParams = new URLSearchParams(hashClean)
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')

          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            window.history.replaceState(null, '', window.location.pathname)
          }
        }

        // 2. Beri jeda singkat agar Supabase memulihkan sesi dari storage lokal
        let { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // Percobaan kedua memastikan sesi benar-benar kosong
          const userRes = await supabase.auth.getUser()
          if (!userRes.data.user) {
            window.location.href = landingUrl
            return
          }
        }

        const currentUserId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id

        if (!currentUserId) {
          window.location.href = landingUrl
          return
        }

        // 3. Ambil profil user
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role, status')
          .eq('id', currentUserId)
          .maybeSingle()

        const statusClean = (profile?.status || '').toLowerCase().trim()
        if (statusClean === 'nonaktif' || statusClean === 'non-aktif' || statusClean === 'banned') {
          alert('Akun Anda dinonaktifkan.')
          await supabase.auth.signOut()
          window.location.href = landingUrl
          return
        }

        if (isMounted) {
          setUserProfile(profile || { full_name: 'Karyawan Site', role: 'Staff' })
          const division = (profile?.role || '').trim().toLowerCase()

          const isSuperAdmin = ['admin', 'administrator', 'superadmin'].includes(division)

          if (isSuperAdmin) {
            setAllowedModules(OPERATIONAL_MODULES.map((m) => m.key))
          } else {
            const { data: perms } = await supabase
              .from('division_permissions')
              .select('division_name, allowed_modules')

            let granted: string[] = []
            if (perms && perms.length > 0) {
              const matched = perms.find((p) => {
                const target = (p.division_name || '').toLowerCase().trim()
                return (
                  target === division ||
                  target.includes(division) ||
                  division.includes(target) ||
                  (division === 'finance' && target.includes('keuangan')) ||
                  (division === 'adm' && (target.includes('administrasi') || target.includes('adm')))
                )
              })

              if (matched && Array.isArray(matched.allowed_modules)) {
                granted = matched.allowed_modules
              }
            }

            // Fallback: minimal user bisa membuka modul rolenya sendiri
            if (granted.length === 0) {
              granted = [division || 'manager-site']
            }

            setAllowedModules(granted)
          }

          setLoading(false)
        }
      } catch (err) {
        console.error('Error load portal:', err)
        if (isMounted) setLoading(false)
      }
    }

    loadUserAndPermissions()

    return () => {
      isMounted = false
    }
  }, [landingUrl])