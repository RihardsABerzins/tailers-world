# Ātrā palīdzība – ainu foni (Blender 5.x, EEVEE + Freestyle kontūras).
# Palaišana Blender Python konsolē: exec(open(ceļš).read()); pēc tam setup(); un both(build_street, 'street') utt.
# Kamera: 1.6 m augstumā, horizontāla, vertikālais leņķis 46.4°, 960x600 – horizonts ainas vidū (sakrīt ar treat.js tēliem).

import bpy, math, bmesh, random
from mathutils import Vector
def hexc(h, a=1.0):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    f = lambda c: c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
    return (f(r), f(g), f(b), a)
_M = {}
def mat(h, emit=0.0, rough=0.8):
    key = (h, emit, rough)
    if key in _M and _M[key].name in bpy.data.materials: return _M[key]
    m = bpy.data.materials.new('tw_' + h.strip('#') + ('_e' if emit else ''))
    m.use_nodes = True; b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = hexc(h); b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = hexc(h); b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = hexc(h); _M[key] = m; return m
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(c)
    return c
def box(name, x, y, z, sx, sy, sz, color, c=None, emit=0.0, bev=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*sx, v.co.y*sy, v.co.z*sz + sz/2))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = (x, y, z)
    (c or bpy.context.scene.collection).objects.link(o); o.data.materials.append(mat(color, emit))
    if bev:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 2
    return o
def cyl(name, x, y, z, r, h, color, c=None, verts=16, emit=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r, depth=h)
    for v in bm.verts: v.co.z += h/2
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = (x, y, z)
    (c or bpy.context.scene.collection).objects.link(o); o.data.materials.append(mat(color, emit)); return o
def sphere(name, x, y, z, r, color, c=None, sub=2, sz=1.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts: v.co.z *= sz
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = (x, y, z)
    (c or bpy.context.scene.collection).objects.link(o); o.data.materials.append(mat(color)); return o
def clear():
    for o in list(bpy.data.objects):
        if o.name != 'TW_Cam': bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for m in list(bpy.data.meshes):
        if m.users == 0: bpy.data.meshes.remove(m)

MD = '/Users/rihardsberzins/Documents/Tclaude/tailers-world/atra-palidziba/models/'
_SRC = {}
def src(rel):
    if rel in _SRC and all(o.name in bpy.data.objects for o in _SRC[rel]): return _SRC[rel]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=MD + rel)
    objs = [o for o in bpy.data.objects if o not in before]
    lib = coll('TW_LIB'); 
    for o in objs:
        for c in list(o.users_collection): c.objects.unlink(o)
        lib.objects.link(o)
    bpy.context.view_layer.layer_collection.children['TW_LIB'].exclude = True
    _SRC[rel] = objs; return objs
def place(rel, x, y, z=0.0, rot=0.0, height=None, length=None, c=None):
    objs = src(rel); meshes = [o for o in objs if o.type == 'MESH']
    import mathutils
    pts = [o.matrix_world @ mathutils.Vector(v) for o in meshes for v in o.bound_box]
    mn = mathutils.Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = mathutils.Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    size = mx - mn; s = 1.0
    if height: s = height / max(size.z, 1e-6)
    if length: s = length / max(size.x, size.y, 1e-6)
    root = bpy.data.objects.new('P_' + rel.split('/')[-1], None); (c or bpy.context.scene.collection).objects.link(root)
    for o in meshes:
        n = bpy.data.objects.new(o.name + '_i', o.data); (c or bpy.context.scene.collection).objects.link(n)
        n.matrix_world = o.matrix_world.copy(); n.location -= mathutils.Vector(((mn.x+mx.x)/2, (mn.y+mx.y)/2, mn.z)); n.parent = root
    root.scale = (s, s, s); root.rotation_euler = (0, 0, rot); root.location = (x, y, z)
    return root

def building(x0, side, y0, y1, H, col, aw, c, rnd, night=False):
    # side=-1: kreisā puse (fasāde x=x0, māja uz -x); +1 labā
    D = 12.0; L = y1 - y0; cx = x0 + side * D / 2; cy = (y0 + y1) / 2
    box('b', cx, cy, 0, D, L, H, col, c)
    box('cor', cx - side * 0.15, cy, H - 0.1, D + 0.3, L + 0.3, 0.45, '#5b4a44', c)       # dzega
    box('base', x0 - side * 0.06, cy, 0, 0.12, L, 0.5, '#6e6a66', c)                        # cokols
    fx = x0 - side * 0.02
    n = max(2, int(L / 3.2)); pitch = L / n
    glass = '#2c3e66' if night else '#8ec3e6'
    for i in range(n):
        y = y0 + pitch * (i + 0.5)
        # 1. stāvs: veikala logs + markīze
        lit = night
        box('shop', fx, y, 0.6, 0.1, pitch * 0.78, 2.3, '#ffd98a' if lit else '#a9d6f0', c, emit=(2.0 if lit else 0))
        box('shopf', fx - side * 0.03, y, 0.55, 0.06, pitch * 0.84, 0.12, '#ffffff', c)
        a = box('awn', x0 - side * 0.7, y, 3.0, 1.4, pitch * 0.86, 0.12, aw if i % 2 == 0 else '#f4f1e4', c)
        a.rotation_euler = (0, side * 0.35, 0)
        # augšējie stāvi
        fl = 3.6
        while fl + 2.0 < H - 0.8:
            on = night and rnd.random() < 0.5
            wc = rnd.choice(['#ffd36a', '#ff9ad5', '#9ae6ff']) if on else glass
            box('win', x0 - side * 0.05, y, fl, 0.1, pitch * 0.42, 1.6, wc, c, emit=(3.0 if on else 0))
            box('wfr', x0 - side * 0.01, y, fl - 0.08, 0.05, pitch * 0.5, 1.76, '#ffffff', c)
            box('sill', fx - side * 0.12, y, fl - 0.16, 0.25, pitch * 0.52, 0.1, '#ece6dc', c)
            fl += 3.2
    # gala siena uz ielas pusi (y0) ar logiem
    for k in range(3):
        xx = x0 + side * (2.0 + k * 3.6); fl = 3.6
        while fl + 2.0 < H - 0.8:
            on = night and rnd.random() < 0.5
            box('ewin', xx, y0 - 0.05, fl, 1.4, 0.1, 1.6, '#ffd36a' if on else glass, c, emit=(3.0 if on else 0)); box('ewf', xx, y0 - 0.01, fl - 0.08, 1.56, 0.05, 1.76, '#ffffff', c); fl += 3.2
def build_street(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(7)
    box('ground', 0, 60, -0.1, 200, 160, 0.1, '#cfc6b8', c)                               # ietve/laukums
    box('road', 0, 104, -0.02, 8.4, 196, 0.03, '#5d6168', c)                             # brauktuve
    for s in (-1, 1): box('curb', s * 4.25, 104, -0.02, 0.25, 196, 0.16, '#e7e1d6', c)
    y = 9
    while y < 200:
        box('dash', 0, y, 0.0, 0.15, 2.2, 0.02, '#f4f1e4', c); y += 5.5
    for k in range(7): box('zebra', -3.3 + k * 1.1, 11.0, 0.0, 0.55, 2.6, 0.02, '#f4f1e4', c)     # gājēju pāreja
    for gx in range(-10, 11): box('tile', gx * 1.2, 4.5, -0.01, 0.03, 9, 0.012, '#b8ad9c', c)    # bruģa šuves
    cols = ['#e3c9a8', '#c98f6f', '#d9d2c3', '#b9c7d6', '#e8b979', '#c4a3c8', '#a8c49a']
    aws = ['#e74c3c', '#2e86de', '#27ae60', '#f39c12']
    for side, x0, yst in ((-1, -8.0, 6.0), (1, 8.0, 9.0)):
        yy = yst; i = 0 if side < 0 else 3
        while yy < 190:
            L = rnd.uniform(9, 15); building(x0, side, yy, yy + L, rnd.uniform(10.5, 18.5), cols[i % len(cols)], aws[i % 4], c, rnd, night); yy += L + 0.05; i += 1
    for y in (24, 40, 60, 90):
        for s in (-1, 1): place('roads/light-square.glb', s * 4.8, y, 0, 0 if s < 0 else 3.14159, height=5.2, c=c)
    for y in (16, 34, 54):
        ntree('nature/tree_default.glb', 6.2, y, 0, rnd.random() * 6, height=5.5, c=c); ntree('nature/tree_oak.glb', -6.2, y + 8, 0, rnd.random() * 6, height=5.0, c=c)
    place('cars/sedan.glb', 2.0, 15, 0, 0, length=4.5, c=c); place('cars/taxi.glb', -2.0, 24, 0, 3.14159, length=4.5, c=c)
    place('cars/suv.glb', 2.0, 36, 0, 0, length=4.8, c=c); place('cars/van.glb', -2.0, 52, 0, 3.14159, length=5.0, c=c)
    place('roads/traffic-light.glb', 4.6, 22, 0, 3.14159, height=4.2, c=c)
    return c

def _alive(objs):
    try: return all(o.name in bpy.data.objects for o in objs)
    except ReferenceError: return False
def src(rel):
    if rel in _SRC and _alive(_SRC[rel]): return _SRC[rel]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=MD + rel)
    objs = [o for o in bpy.data.objects if o not in before]
    lib = coll('TW_LIB')
    for o in objs:
        for cc in list(o.users_collection): cc.objects.unlink(o)
        lib.objects.link(o)
    bpy.context.view_layer.layer_collection.children['TW_LIB'].exclude = True
    _SRC[rel] = objs; return objs
def clear():
    lib = bpy.data.collections.get('TW_LIB'); keep = set(lib.objects) if lib else set()
    for o in list(bpy.data.objects):
        if o.name != 'TW_Cam' and o not in keep and o.type != 'LIGHT' or (o.type == 'LIGHT' and o.name.startswith('TWL')): bpy.data.objects.remove(o, do_unlink=True)
    for cc in list(bpy.data.collections):
        if cc.name != 'TW_LIB': bpy.data.collections.remove(cc)
    for m in list(bpy.data.meshes):
        if m.users == 0: bpy.data.meshes.remove(m)

def lights(night=False):
    for o in list(bpy.data.objects):
        if o.type == 'LIGHT' and o.name.startswith('TWL_sun'): bpy.data.objects.remove(o, do_unlink=True)
    sc = bpy.context.scene; w = sc.world; bgn = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    ld = bpy.data.lights.new('TWL_sun', 'SUN'); so = bpy.data.objects.new('TWL_sun', ld); sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(50), math.radians(-25), math.radians(35))
    if night:
        ld.energy = 0.35; ld.color = (0.55, 0.62, 1.0); bgn.inputs['Color'].default_value = hexc('#2b3466'); bgn.inputs['Strength'].default_value = 0.55
    else:
        ld.energy = 3.2; ld.color = (1.0, 0.95, 0.86); ld.angle = math.radians(8); bgn.inputs['Color'].default_value = hexc('#b9d9f2'); bgn.inputs['Strength'].default_value = 1.0
    sc.eevee.taa_render_samples = 24
def render(path):
    bpy.context.scene.render.filepath = path; bpy.ops.render.render(write_still=True); return path

def nightlamps(names=('P_light-square',), energy=700):
    for o in [o for o in bpy.data.objects if o.name.startswith(names)]:
        ld = bpy.data.lights.new('TWL_p', 'POINT'); ld.energy = energy; ld.color = (1.0, 0.8, 0.55); ld.shadow_soft_size = 0.6
        lo = bpy.data.objects.new('TWL_p', ld); bpy.context.scene.collection.objects.link(lo); lo.location = (o.location.x * 0.8, o.location.y, 4.6)
def both(fn, name, **kw):
    OUT = '/Users/rihardsberzins/Documents/Tclaude/tailers-world/atra-palidziba/bg/'
    for night in (False, True):
        fn(night, **kw); lights(night)
        if night: nightlamps()
        render(OUT + name + ('_n.webp' if night else '_d.webp'))

def pmesh(name, pts, z, color, c, emit=0.0):
    me = bpy.data.meshes.new(name); me.from_pydata([(x, y, z) for x, y in pts], [], [list(range(len(pts)))]); me.update()
    o = bpy.data.objects.new(name, me); c.objects.link(o); o.data.materials.append(mat(color, emit)); return o
def strip(name, cl, w, z, color, c):
    # josla pa līkni cl=[(x,y)...] ar platumu w
    L, R = [], []
    for i, (x, y) in enumerate(cl):
        x2, y2 = cl[min(i + 1, len(cl) - 1)]; x1, y1 = cl[max(i - 1, 0)]; dx, dy = x2 - x1, y2 - y1; d = math.hypot(dx, dy) or 1
        nx, ny = -dy / d * w / 2, dx / d * w / 2; L.append((x + nx, y + ny)); R.append((x - nx, y - ny))
    return pmesh(name, L + R[::-1], z, color, c)
def hedge(x, y, sx, sy, c, h=0.9): return box('hedge', x, y, 0, sx, sy, h, '#3f8f3a', c, bev=0.15)
def bench3d(x, y, rot, c):
    e = bpy.data.objects.new('bench', None); c.objects.link(e)
    for o in (box('bs', 0, 0, 0.42, 1.8, 0.45, 0.07, '#8e6b47', c), box('bb', 0, 0.22, 0.6, 1.8, 0.06, 0.4, '#8e6b47', c), box('l1', -0.75, 0, 0, 0.08, 0.4, 0.42, '#4a4a4a', c), box('l2', 0.75, 0, 0, 0.08, 0.4, 0.42, '#4a4a4a', c)): o.parent = e
    e.location = (x, y, 0); e.rotation_euler = (0, 0, rot); return e
def treeline(c, y0, rnd, n=40, spread=80):
    for i in range(n):
        x = rnd.uniform(-spread, spread); y = y0 + rnd.uniform(0, 25)
        if abs(x) < 6 and y < 30: continue
        ntree(rnd.choice(['nature/tree_default.glb', 'nature/tree_oak.glb', 'nature/tree_fat.glb', 'nature/tree_pineRoundA.glb', 'nature/tree_detailed.glb']), x, y, 0, rnd.random() * 6, height=rnd.uniform(5, 9), c=c)
def cityfar(c, rnd, y0=70, n=26, cols=('#9db6d4', '#a9bcd6', '#b7c4d8', '#8fa8c8')):
    for i in range(n):
        x = -90 + i * 7 + rnd.uniform(-2, 2); box('far', x, y0 + rnd.uniform(0, 20), 0, 6, 6, rnd.uniform(10, 30), rnd.choice(cols), c)
def build_park(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(3)
    box('ground', 0, 60, -0.1, 220, 180, 0.1, '#79c25f', c)
    cl = [(0.6 * math.sin(t * 0.18) * t * 0.35 + 0.0, 2 + t) for t in [i * 1.0 for i in range(0, 60)]]
    strip('path', cl, 3.2, 0.005, '#e7dcc4', c); strip('pathE', cl, 3.6, 0.002, '#cdbd9a', c)
    cityfar(c, rnd); treeline(c, 34, rnd, 55)
    for (x, y, k) in ((-7, 10, 'nature/tree_oak.glb'), (7.5, 13, 'nature/tree_default.glb'), (-12, 18, 'nature/tree_pineRoundA.glb'), (11, 22, 'nature/tree_fat.glb'), (-5, 26, 'nature/tree_default.glb'), (5, 30, 'nature/tree_oak.glb')):
        ntree(k, x, y, 0, 0, height=rnd.uniform(6, 8), c=c)
    for y in (19, 31): place('roads/light-square.glb', -2.6 + 0.6 * math.sin(y * 0.18) * y * 0.35, y, 0, 0, height=4.2, c=c)
    hedge(-9, 8, 6, 1.0, c); hedge(9.5, 9, 5, 1.0, c); hedge(-14, 14, 1.0, 8, c)
    pmesh('pond', [(8 + 3.5 * math.cos(a / 10 * 6.283), 20 + 2.2 * math.sin(a / 10 * 6.283)) for a in range(10)], 0.01, '#5fa8d8', c)
    cyl('fount', -0.5, 22, 0, 1.6, 0.4, '#d9d2c3', c, 20); cyl('fw', -0.5, 22, 0.05, 1.4, 0.4, '#7cc4ec', c, 20); cyl('fc', -0.5, 22, 0, 0.25, 1.4, '#d9d2c3', c)
    for (x, y) in ((-4, 15), (4.5, 16)): bench3d(x, y, 3.14159 if x < 0 else 0, c)
    for i in range(14):
        x, y = rnd.uniform(-10, 10), rnd.uniform(7, 20)
        if abs(x) < 3.5: continue
        sphere('fl', x, y, 0.1, 0.18, rnd.choice(['#ff5a7a', '#ffd34d', '#b388ff', '#ff8a3d']), c, 1)
    return c
def build_garden(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(5)
    box('ground', 0, 60, -0.1, 220, 180, 0.1, '#7cc46a', c); cityfar(c, rnd); treeline(c, 45, rnd, 35)
    # māja
    box('house', -9, 18, 0, 9, 7, 4.2, '#f3e3c6', c)
    me = bpy.data.meshes.new('roof'); v = [(-4.9, -3.9, 0), (4.9, -3.9, 0), (4.9, 3.9, 0), (-4.9, 3.9, 0), (0, -3.9, 2.6), (0, 3.9, 2.6)]
    me.from_pydata(v, [], [(0, 1, 4), (3, 5, 2), (0, 4, 5, 3), (1, 2, 5, 4), (0, 3, 2, 1)]); me.update(); ro = bpy.data.objects.new('roof', me); c.objects.link(ro); ro.location = (-9, 18, 4.2); ro.data.materials.append(mat('#c0503c'))
    box('door', -9, 14.48, 0, 1.1, 0.1, 2.1, '#7a4a2a', c)
    for x in (-12, -6): box('hw', x, 14.47, 1.3, 1.5, 0.1, 1.2, '#ffd98a' if night else '#a8d4f0', c, emit=(2.5 if night else 0)); box('hwf', x, 14.5, 1.22, 1.7, 0.06, 1.36, '#ffffff', c)
    box('chim', -7, 18, 5, 0.8, 0.8, 2.2, '#9c4430', c)
    # žogs
    y = 3.0
    while y < 40:
        box('picket', 6.5, y, 0, 0.12, 0.12, 1.1, '#ffffff', c); y += 0.45
    for h in (0.35, 0.8): box('rail', 6.5, 21.5, h, 0.06, 37, 0.1, '#ffffff', c)
    # dobes
    for row in range(3):
        box('bed', 2.5 + row * 1.3, 16, 0, 0.9, 16, 0.18, '#6b4a2e', c)
        for k in range(22): sphere('fl', 2.5 + row * 1.3 + rnd.uniform(-0.3, 0.3), 8.5 + k * 0.7, 0.32, 0.17, rnd.choice(['#ff5a7a', '#ffd34d', '#b388ff', '#ff8a3d', '#ffffff']), c, 1)
    box('shed', 11, 24, 0, 3, 3, 2.4, '#8e6b47', c); ntree('nature/tree_oak.glb', -2.5, 26, 0, 1, height=7, c=c); ntree('nature/tree_default.glb', 10, 12, 0, 2, height=6, c=c)
    return c
def build_playground(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(9)
    box('ground', 0, 60, -0.1, 220, 180, 0.1, '#86c86a', c); cityfar(c, rnd); treeline(c, 40, rnd, 35)
    box('sand', 0, 9, -0.05, 22, 14, 0.06, '#ead39b', c)
    # slidkalniņš
    box('tower', -6, 14, 0, 2, 2, 2.2, '#3d6fb6', c); box('plat', -6, 14, 2.2, 2.3, 2.3, 0.15, '#ffd34d', c)
    for x in (-6.9, -5.1):
        for y in (13.1, 14.9): box('post', x, y, 2.35, 0.12, 0.12, 1.2, '#3d6fb6', c)
    roof = box('troof', -6, 14, 3.55, 2.5, 2.5, 0.2, '#e74c3c', c)
    sl = box('slide', -3.2, 14, 0.2, 4.2, 1.0, 0.12, '#ff7a3d', c); sl.rotation_euler = (0, math.radians(30), 0); sl.location = (-3.3, 14, 1.15)
    for k in range(6): box('lad', -6, 12.6, 0.3 + k * 0.35, 1.0, 0.08, 0.06, '#3d6fb6', c)
    # karuselis + smilšu kaste
    cyl('carou', 6, 16, 0, 1.6, 0.25, '#e74c3c', c, 24); cyl('cpole', 6, 16, 0, 0.12, 1.2, '#ffd34d', c)
    box('sbox', -9, 8, 0, 3, 3, 0.35, '#8e6b47', c); box('sbin', -9, 8, 0.05, 2.6, 2.6, 0.35, '#f2dfa6', c)
    y = 2
    while y < 30: box('fence', -13, y, 0, 0.1, 0.1, 1.0, '#5a6b78', c); y += 1.2
    box('frail', -13, 16, 0.9, 0.06, 28, 0.08, '#5a6b78', c)
    bench3d(-10, 20, 0, c); cyl('bucket', 4.5, 9, 0, 0.18, 0.25, '#e74c3c', c, 12); box('spade', 5.0, 9.2, 0, 0.12, 0.5, 0.04, '#ffd34d', c)
    ntree('nature/tree_default.glb', 10, 22, 0, 1, height=7, c=c); ntree('nature/tree_oak.glb', -15, 24, 0, 2, height=7.5, c=c)
    return c
def build_school(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(11)
    box('ground', 0, 60, -0.1, 220, 180, 0.1, '#9ea4ab', c); box('lawn', 0, 80, -0.09, 220, 60, 0.1, '#79c25f', c); cityfar(c, rnd)
    Y = 32; box('school', 0, Y + 6, 0, 60, 12, 11, '#b5553d', c); box('scor', 0, Y + 6, 11, 61, 12.6, 0.5, '#7f8c8d', c)
    box('wing', -24, Y - 4, 0, 12, 10, 11, '#a64c36', c)
    for fl in (1.2, 4.6, 8.0):
        x = -27
        while x < 30:
            if not (fl < 3 and -3 < x < 3):
                on = night and rnd.random() < 0.4
                box('sw', x, Y - 0.06, fl, 1.8, 0.1, 1.9, '#ffd36a' if on else ('#2a3156' if night else '#cfe8ff'), c, emit=(2.5 if on else 0)); box('swf', x, Y - 0.02, fl - 0.1, 2.0, 0.06, 2.1, '#ffffff', c)
            x += 3.4
    box('ent', 0, Y - 0.05, 0, 3.2, 0.1, 2.8, '#3c5a78', c); box('canopy', 0, Y - 1, 2.9, 4.6, 2.2, 0.2, '#7f8c8d', c)
    bpy.ops.object.text_add(location=(0, Y - 0.12, 3.5)); t = bpy.context.object; t.data.body = 'SKOLA'; t.data.align_x = 'CENTER'; t.data.size = 1.1; t.rotation_euler = (math.radians(90), 0, 0); t.data.extrude = 0.05
    for cc in list(t.users_collection): cc.objects.unlink(t)
    c.objects.link(t); t.data.materials.append(mat('#ffffff'))
    for k in range(4): box('hop', 4 + (k % 2) * 0.9, 8 + k * 0.9, 0, 0.8, 0.8, 0.01, '#f4f1e4', c)
    pmesh('ring', [(-5 + 2.4 * math.cos(a / 24 * 6.283), 12 + 2.4 * math.sin(a / 24 * 6.283)) for a in range(24)], 0.006, '#e8d07a', c)
    cyl('hoop', 9, 14, 0, 0.1, 3.4, '#555555', c); box('board', 9, 13.6, 3.0, 1.8, 0.08, 1.1, '#ffffff', c); cyl('rim', 9, 13.2, 3.05, 0.25, 0.04, '#ff7a1a', c)
    for x, y in ((-14, 20), (14, 22), (-20, 26), (21, 27)): ntree('t', x, y, 0, 0, 7, c)
    for x in (-8, 6): bench3d(x, 24, 0, c)
    for k in range(6): cyl('rack', 12 + k * 0.6, 19, 0, 0.04, 0.8, '#888888', c)
    y = 4
    while y < 30: box('sf', -16, y, 0, 0.08, 0.08, 1.4, '#4f6a4f', c); y += 1.5
    return c
def build_concert(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(13)
    box('ground', 0, 60, -0.1, 220, 180, 0.1, '#6fae55', c); treeline(c, 40, rnd, 30); cityfar(c, rnd)
    Y = 22; box('stage', 2, Y, 0, 18, 7, 1.4, '#2b2b3a', c); box('back', 2, Y + 3.3, 1.4, 17, 0.4, 7, '#1d1d2c', c)
    box('screen', 2, Y + 3.05, 3.0, 9, 0.1, 4, '#ff4fd8' if night else '#5ac8ff', c, emit=1.6)
    for x in (-7, 11): box('tr', x, Y - 3, 1.4, 0.3, 0.3, 8.5, '#9aa0a6', c)
    box('trt', 2, Y - 3, 9.6, 18.6, 0.35, 0.35, '#9aa0a6', c)
    for x in (-5.5, 9.5): box('spk', x, Y - 2.5, 1.4, 1.6, 1.4, 3.4, '#151518', c)
    for i, col in enumerate(['#ff4fd8', '#5ac8ff', '#ffd34d', '#7dff9a']):
        x = -4 + i * 4; cyl('spot', x, Y - 3, 9.1, 0.3, 0.5, col, c, 12, emit=6)
        if night:
            ld = bpy.data.lights.new('TWL_s', 'SPOT'); ld.energy = 4000; ld.color = hexc(col)[:3]; ld.spot_size = math.radians(35)
            lo = bpy.data.objects.new('TWL_s', ld); c.objects.link(lo); lo.location = (x, Y - 3, 9); lo.rotation_euler = (math.radians(20), 0, 0)
    for row in range(6):
        y = Y - 6 - row * 1.3
        x = -14 + rnd.uniform(0, 1)
        while x < 16:
            if not (abs(x) < 4.5 and y < 13):
                col = rnd.choice(['#4a3a62', '#3a4a6a', '#5a3a4a', '#2f3f4f'])
                person(x, y, c, rnd, rnd.random() < 0.3)
            x += rnd.uniform(0.7, 1.1)
    for x in (-16, 18): place('roads/light-square.glb', x, 10, 0, 0, height=5, c=c)
    for x, y in ((-20, 18), (22, 20), (-26, 30), (28, 32)): ntree('t', x, y, 0, 0, 8, c)
    return c
def build_kitchen(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(17)
    W0, W1, BY, HC = -4.2, 4.2, 9.0, 2.9
    for i in range(-6, 6):
        for j in range(0, 14):
            box('t', i * 0.7 + 0.35, j * 0.7 + 0.35, -0.02, 0.7, 0.7, 0.02, '#c9a77c' if (i + j) % 2 else '#b8936a', c)
    box('wl', W0 - 0.1, 4, 0, 0.2, 14, HC, '#efe2cf', c); box('wr', W1 + 0.1, 4, 0, 0.2, 14, HC, '#e8dac6', c); box('wb', 0, BY + 0.1, 0, 9, 0.2, HC, '#f3e6d3', c)
    box('ceil', 0, 4, HC, 9, 14, 0.1, '#fbf5ea', c)
    box('win', 0.3, BY - 0.02, 1.25, 1.8, 0.06, 1.1, '#2c3160' if night else '#9fd2f5', c, emit=(0 if night else 0.6)); box('winf', 0.3, BY, 1.18, 2.0, 0.05, 1.24, '#ffffff', c)
    box('wcross', 0.3, BY - 0.06, 1.25, 0.06, 0.04, 1.1, '#ffffff', c)
    box('lower', -0.5, BY - 0.35, 0, 7.4, 0.65, 0.88, '#e0e6ea', c); box('top', -0.5, BY - 0.38, 0.88, 7.5, 0.72, 0.05, '#8e6b47', c)
    for x in (-3.5, -2.3, -1.1, 1.7, 2.9): box('door', x, BY - 0.69, 0.08, 1.05, 0.02, 0.72, '#cfd7dd', c)
    for x in (-2.8, -1.4, 2.0, 3.2): box('up', x, BY - 0.2, 1.75, 1.3, 0.4, 0.8, '#d9c4a5', c)
    box('stove', -2.2, BY - 0.36, 0.92, 0.7, 0.55, 0.02, '#333333', c)
    box('fridge', W0 + 0.45, 6.5, 0, 0.8, 0.8, 2.0, '#f7fafb', c); box('fh', W0 + 0.87, 6.5, 0.9, 0.04, 0.06, 0.5, '#9aa5ad', c)
    # galds labajā pusē (uz tā tējas krūze – rekvizīts tiek zīmēts spēlē)
    box('table', 1.6, 5.5, 0.72, 1.6, 1.0, 0.06, '#a77a4f', c)
    for dx in (-0.7, 0.7):
        for dy in (-0.4, 0.4): box('tl', 1.6 + dx, 5.5 + dy, 0, 0.07, 0.07, 0.72, '#5c4430', c)
    for dy in (-0.9, 0.9): box('chair', 2.5, 5.5 + dy * 0.6, 0.42, 0.45, 0.45, 0.05, '#8e6b47', c)
    cyl('lamp', 0, 5, 2.3, 0.35, 0.25, '#ffd98a' if night else '#f4f1e4', c, 16, emit=(4 if night else 0))
    if night:
        ld = bpy.data.lights.new('TWL_k', 'POINT'); ld.energy = 250; ld.color = (1, 0.85, 0.6); lo = bpy.data.objects.new('TWL_k', ld); c.objects.link(lo); lo.location = (0, 5, 2.2)
    else:
        ld = bpy.data.lights.new('TWL_k', 'AREA'); ld.energy = 400; ld.size = 2; lo = bpy.data.objects.new('TWL_k', ld); c.objects.link(lo); lo.location = (0.3, BY - 1.0, 1.6); lo.rotation_euler = (math.radians(-90), 0, 0)
    return c

def ntree(rel, x, y, z=0.0, rot=0.0, height=6.0, c=None):
    rr = random.Random(int(x * 100 + y * 37)); fir = 'pine' in rel; c = c or bpy.context.scene.collection
    h = height; tr = cyl('trunk', x, y, 0, 0.12 * h / 6, h * (0.25 if fir else 0.42), '#7a5233', c, 8)
    if fir:
        for k, (r, zz) in enumerate(((1.5, 0.18), (1.15, 0.42), (0.75, 0.64))):
            me = bpy.data.meshes.new('fir'); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=9, radius1=r * h / 6, radius2=0, depth=h * 0.38)
            for v in bm.verts: v.co.z += h * 0.19
            bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('fir', me); o.location = (x, y, h * zz); c.objects.link(o); o.data.materials.append(mat(['#2f7d4a', '#3a8f55', '#2a6f42'][k]))
        return tr
    greens = ['#4f9d45', '#5fae4f', '#468f3e', '#6cbc55']
    for k in range(7):
        dx, dy, dz = rr.uniform(-.5, .5) * h / 6, rr.uniform(-.5, .5) * h / 6, rr.uniform(.55, .82) * h
        sphere('leaf', x + dx * 1.8, y + dy * 1.8, dz, rr.uniform(1.25, 1.65) * h / 6, rr.choice(greens), c, 1, 0.85)
    return tr
def cityfar(c, rnd, y0=150, n=44, cols=('#c3d3e6', '#cbd8e8', '#b8cbe0', '#d2dceb')):
    for i in range(n):
        x = -160 + i * 7.5 + rnd.uniform(-2, 2); box('far', x, y0 + rnd.uniform(0, 30), 0, rnd.uniform(6, 10), 6, rnd.uniform(8, 24), rnd.choice(cols), c)
def person(x, y, c, rnd, arms=False):
    col = rnd.choice(['#4a3a62', '#3a4a6a', '#6a3a4a', '#2f4f5f', '#5a5a2a', '#7a3a3a']); h = rnd.uniform(1.55, 1.85)
    me = bpy.data.meshes.new('bod'); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=0.2, radius2=0.27, depth=h * 0.62)
    for v in bm.verts: v.co.z += h * 0.31
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('bod', me); o.location = (x, y, 0); c.objects.link(o); o.data.materials.append(mat(col))
    sphere('sh', x, y, h * 0.62, 0.27, col, c, 1, 0.5); sphere('hd', x, y, h * 0.8, 0.15, rnd.choice(['#e0b896', '#c99a72', '#f2cfa8', '#8d5a3a']), c, 2)
    sphere('hair', x, y + 0.03, h * 0.84, 0.155, rnd.choice(['#2b1d14', '#6b4423', '#d8b45a', '#1a1a1a', '#a0522d']), c, 2, 0.75)
    if arms:
        for s in (-1, 1):
            a = box('arm', x + s * 0.22, y, h * 0.6, 0.09, 0.09, 0.6, col, c); a.rotation_euler = (0, s * -0.35, 0)

def both(fn, name, **kw):
    OUT = '/Users/rihardsberzins/Documents/Tclaude/tailers-world/atra-palidziba/bg/'
    for night in (False, True):
        fn(night, **kw); lights(night)
        if name == 'kitchen':
            w = bpy.context.scene.world; bgn = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bgn.inputs['Color'].default_value = hexc('#f6e7d0' if not night else '#4a3f55'); bgn.inputs['Strength'].default_value = 0.55 if not night else 0.25
            for o in bpy.data.objects:
                if o.name.startswith('TWL_k') and o.data.type == 'AREA': o.data.energy = 120; o.data.color = (1, 0.93, 0.8)
        if night: nightlamps()
        render(OUT + name + ('_n.webp' if night else '_d.webp'))

def setup():
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('TW_Cam'); cam = bpy.data.objects.new('TW_Cam', cd); sc.collection.objects.link(cam)
    cam.location = (0, 0, 1.6); cam.rotation_euler = (math.radians(90), 0, 0); cd.sensor_fit = 'VERTICAL'; cd.angle_y = math.radians(46.4); cd.clip_end = 400; sc.camera = cam
    r = sc.render; r.resolution_x = 960; r.resolution_y = 600; r.film_transparent = True; r.image_settings.file_format = 'WEBP'; r.image_settings.color_mode = 'RGBA'; r.image_settings.quality = 82
    sc.view_settings.view_transform = 'Standard'; r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'
    ls = sc.view_layers[0].freestyle_settings.linesets[0]; ls.linestyle.color = (0.1, 0.09, 0.12); ls.linestyle.thickness = 2.2
    w = sc.world or bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True

# ---- tēli ----
TWV = {'sit_def': {'head': [236, 173], 'neck': [236, 196], 'shL': [213, 202], 'shR': [259, 202], 'hipL': [220, 264], 'hipR': [252, 266], 'armL': [[216, 208], [204, 232], [206, 260]], 'armR': [[256, 208], [266, 230], [270, 256]], 'legL': [[236, 262], [276, 250], [312, 266]], 'legR': [[246, 268], [284, 262], [322, 272]], 'hr': 21, 'lie': False, 'shoeA': -1.3}, 'lie': {'head': [123, 252], 'neck': [144, 252], 'shL': [150, 275], 'shR': [150, 229], 'hipL': [208, 270], 'hipR': [208, 234], 'armL': [[156, 276], [184, 283], [210, 285]], 'armR': [[156, 228], [184, 221], [210, 219]], 'legL': [[208, 262], [254, 263], [292, 263]], 'legR': [[208, 242], [254, 241], [292, 241]], 'hr': 19, 'lie': True}, 'bench': {'head': [240, 138.5], 'neck': [240, 160], 'shL': [217, 166], 'shR': [263, 166], 'hipL': [226, 226], 'hipR': [254, 226], 'armL': [[219, 172], [209, 200], [227, 232]], 'armR': [[261, 172], [271, 200], [253, 232]], 'legL': [[228, 240], [227, 252], [226, 278]], 'legR': [[252, 240], [253, 252], [254, 278]], 'thighs': [[228, 226], [252, 226]], 'hr': 19.5, 'lie': False, 'bench': True, 'shoeA': 0}, 'sit_fr': {'head': [236, 173], 'neck': [236, 196], 'shL': [213, 202], 'shR': [259, 202], 'hipL': [220, 264], 'hipR': [252, 266], 'armL': [[216, 208], [204, 232], [206, 260]], 'armR': [[256, 208], [262, 232], [238, 242]], 'legL': [[236, 262], [276, 250], [312, 266]], 'legR': [[246, 268], [284, 262], [322, 272]], 'hr': 21, 'lie': False, 'shoeA': -1.3}, 'sit_burn': {'head': [236, 173], 'neck': [236, 196], 'shL': [213, 202], 'shR': [259, 202], 'hipL': [220, 264], 'hipR': [252, 266], 'armL': [[216, 208], [204, 232], [206, 260]], 'armR': [[256, 208], [276, 226], [298, 232]], 'legL': [[236, 262], [276, 250], [312, 266]], 'legR': [[246, 268], [284, 262], [322, 272]], 'hr': 21, 'lie': False, 'shoeA': -1.3}, 'slump_def': {'head': [248, 187], 'neck': [244, 206], 'shL': [221, 212], 'shR': [267, 212], 'hipL': [220, 264], 'hipR': [252, 266], 'armL': [[224, 218], [204, 242], [206, 260]], 'armR': [[264, 218], [274, 240], [270, 256]], 'legL': [[236, 262], [276, 250], [312, 266]], 'legR': [[246, 268], [284, 262], [322, 272]], 'hr': 21, 'lie': False, 'shoeA': -1.3}, 'sit_bee': {'head': [236, 175], 'neck': [236, 196], 'shL': [213, 202], 'shR': [259, 202], 'hipL': [220, 264], 'hipR': [252, 266], 'armL': [[216, 208], [198, 222], [180, 232]], 'armR': [[256, 208], [266, 230], [270, 256]], 'legL': [[236, 262], [276, 250], [312, 266]], 'legR': [[246, 268], [284, 262], [322, 272]], 'hr': 19, 'lie': False, 'shoeA': -1.3}}
D0 = 4.0; PX = 0.6857 * D0 / 240
def U(p, dy=0.0):
    sx, sy = p; return Vector(((sx - 240) * PX, D0 + dy, 1.6 - (sy - 150) * PX))
_LM = {}
def lmat(layer, color=None):
    key = layer + (color or '')
    if key in _LM and _LM[key].name in bpy.data.materials: return _LM[key]
    m = mat(color or '#ffffff'); m = m.copy(); m.name = 'L_' + key; m['layer'] = layer; m['orig'] = color or '#ffffff'; _LM[key] = m; return m
def tag(o, layer, color=None):
    o['layer'] = layer; o.data.materials.clear(); o.data.materials.append(lmat(layer, color)); return o
def ball(name, p, r, layer, c, color=None, sc=(1, 1, 1)):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=r)
    for v in bm.verts: v.co = Vector((v.co.x * sc[0], v.co.y * sc[1], v.co.z * sc[2]))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); o.location = p; c.objects.link(o)
    for f in o.data.polygons: f.use_smooth = True
    return tag(o, layer, color)
def capsule(name, a, b, r, layer, c, color=None, r2=None):
    r2 = r2 or r; d = b - a; L = d.length
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=False, segments=16, radius1=r, radius2=r2, depth=L)
    for v in bm.verts: v.co.z += L / 2
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); c.objects.link(o)
    for f in o.data.polygons: f.use_smooth = True
    o.location = a; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized())
    tag(o, layer, color); ball(name + 'j', a, r, layer, c, color); ball(name + 'k', b, r2, layer, c, color); return o
def torso3d(name, sl, sr, hl, hr_, layer, c, color=None, depth=0.24, dy=0.0):
    top = (U(sl, dy) + U(sr, dy)) / 2; bot = (U(hl, dy) + U(hr_, dy)) / 2; up = (top - bot); L = up.length; up.normalize()
    wt = (U(sl) - U(sr)).length + 0.07; wb = (U(hl) - U(hr_)).length + 0.06
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        t = v.co.z + 0.5; w = wb + (wt - wb) * t; v.co = Vector((v.co.x * w, v.co.y * depth, t * L))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); c.objects.link(o)
    o.rotation_mode = 'QUATERNION'; side = Vector((up.z, 0, -up.x))  # perpendicular in XZ plane
    import mathutils
    m = mathutils.Matrix((side, Vector((0, 1, 0)), up)).transposed(); o.rotation_quaternion = m.to_quaternion(); o.location = bot
    md = o.modifiers.new('bev', 'BEVEL'); md.width = 0.07; md.segments = 4; md.limit_method = 'NONE'
    o.modifiers.new('sub', 'SUBSURF').levels = 1
    for f in o.data.polygons: f.use_smooth = True
    return tag(o, layer, color)
def headset(P, c, hr_px, dyh=-0.03, hats=('hairS', 'hairL', 'hairO')):
    hc = U(P['head'], dyh); nk = U(P['neck'], 0.0); r = hr_px * PX
    up = (hc - nk); up.normalize(); fwd = Vector((0, -1, 0)); side = up.cross(fwd).normalized()
    ball('head', hc, r, 'skin', c, sc=(0.9, 0.95, 1.0) if not P.get('lie') else (1.0, 0.95, 0.9))
    for s in (-1, 1): ball('ear', hc + side * (r * 0.9) + up * (r * 0.05), r * 0.24, 'skin', c)
    capsule('neck', nk + up * 0.0, hc - up * (r * 0.5), r * 0.32, 'skin', c)
    if 'hairS' in hats or 'hairL' in hats:
        for nm in [h for h in hats if h in ('hairS', 'hairL')]:
            ball(nm + '_cap', hc + up * (r * 0.42) + Vector((0, r * 0.28, 0)), r * 1.07, nm, c, sc=(1, 1, 0.8) if not P.get('lie') else (0.8, 1, 1))
            if nm == 'hairL': ball('hairL_back', hc - up * (r * 0.55) + Vector((0, r * 0.55, 0)), r * 1.12, nm, c, sc=(1.05, 0.6, 1.25) if not P.get('lie') else (1.25, 0.6, 1.05))
    if 'hairO' in hats:
        for s in (-1, 1): ball('hairO_t', hc + side * (r * 0.82) + up * (r * 0.05), r * 0.3, 'hairO', c, sc=(0.7, 1, 1.3) if not P.get('lie') else (1.3, 1, 0.7))
    return hc, up, side, r
def build_patient(key):
    clear(); c = coll('TW_CHAR'); P = bpy.app.driver_namespace['TWV'][key]; lie = P.get('lie')
    hr = 20.0; dl = -0.10 if not lie else 0.0; da = -0.14 if not lie else 0.0
    # kājas (bikses) + kurpes
    for k, leg in (('L', P['legL']), ('R', P['legR'])):
        pts = [U(p, dl - (0.04 if k == 'L' else 0)) for p in leg]
        for i in range(len(pts) - 1): capsule('leg' + k + str(i), pts[i], pts[i + 1], 0.085, 'pants', c)
        cuff = pts[-2].lerp(pts[-1], 0.8); capsule('cuff' + k, cuff, pts[-1], 0.095, 'pants', c)
        f = pts[-1]; d = (pts[-1] - pts[-2]).normalized()
        if lie: sp = f + Vector((0, -0.02, 0)) + Vector((-0.0, 0, 0)); toe = Vector((0, -1, 0))
        elif P.get('bench'): toe = Vector((0, -1, 0))
        else: toe = Vector((0, 0, 1)) * 0.6 + d * 0.4
        ball('shoe' + k, f + toe.normalized() * 0.05, 0.075, 'fixed', c, '#26242c', sc=(1, 1.6, 0.75) if not lie else (1.6, 1, 0.75))
    if P.get('thighs'):
        for k, t in enumerate(P['thighs']):
            a = U(t, -0.02); b = U((t[0], t[1] + 10), -0.32); capsule('thigh' + str(k), a, b, 0.095, 'pants', c)
    torso3d('torso', P['shL'], P['shR'], P['hipL'], P['hipR'], 'shirt', c)
    for k, arm in (('L', P['armL']), ('R', P['armR'])):
        pts = [U(p, da) for p in arm]
        sl = pts[0].lerp(pts[1], 0.7); capsule('slv' + k, pts[0], sl, 0.082, 'shirt', c, r2=0.075)
        capsule('ua' + k, pts[0], pts[1], 0.06, 'skin', c); capsule('fa' + k, pts[1], pts[2], 0.055, 'skin', c)
        ball('hand' + k, pts[2], 0.068, 'skin', c)
    headset(P, c, hr)
    return c

COL = {'skin': '#f2c9a0', 'shirt': '#16a085', 'pants': '#2c3e50', 'hairS': '#3b2a1a', 'hairL': '#3b2a1a', 'hairO': '#bbbbbb'}
def preview(path, hair='hairS'):
    sc = bpy.context.scene
    for o in bpy.data.collections['TW_CHAR'].objects:
        L = o.get('layer'); o.hide_render = L in ('hairS', 'hairL', 'hairO') and L != hair
        if L in COL:
            m = o.data.materials[0]; b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); b.inputs['Base Color'].default_value = hexc(COL[L])
    sc.render.use_freestyle = True; lights(False); render(path)

def _hold():
    m = bpy.data.materials.get('TW_HOLD')
    if not m:
        m = bpy.data.materials.new('TW_HOLD'); m.use_nodes = True; nt = m.node_tree
        for n in list(nt.nodes): nt.nodes.remove(n)
        h = nt.nodes.new('ShaderNodeHoldout'); o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(h.outputs[0], o.inputs['Surface'])
    return m
def _white():
    m = bpy.data.materials.get('TW_WHITE')
    if not m:
        m = bpy.data.materials.new('TW_WHITE'); m.use_nodes = True; b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'); b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 0.75
    return m
def render_layers(prefix, layers, hairs, outdir):
    sc = bpy.context.scene; objs = list(bpy.data.collections['TW_CHAR'].objects); H, W = _hold(), _white()
    orig = {o.name: o.data.materials[0] for o in objs}
    def setm(o, m): o.data.materials[0] = m
    out = []
    for L in layers:
        for o in objs:
            ol = o.get('layer'); o.hide_render = False
            setm(o, W if ol == L and L != 'fixed' else (orig[o.name] if ol == L == 'fixed' else H))
        sc.render.use_freestyle = False; render(outdir + prefix + '_' + L + '.webp'); out.append(L)
    for hv in hairs:
        for o in objs:
            ol = o.get('layer'); o.hide_render = ol in ('hairS', 'hairL', 'hairO', 'hatCap', 'hatBeanie') and ol != hv; setm(o, H)
        sc.render.use_freestyle = True; render(outdir + prefix + '_line_' + hv + '.webp'); out.append('line_' + hv)
    for o in objs: setm(o, orig[o.name]); o.hide_render = False
    return out

def build_medic():
    clear(); c = coll('TW_CHAR'); O = (240, 290)
    q = lambda p: (O[0] + p[0], O[1] + p[1])
    B = {'head': (0, -130), 'neck': (0, -106), 'shL': (-17, -102), 'shR': (17, -102), 'hipL': (-14, -56), 'hipR': (14, -56),
         'armL': [(-18, -96), (-23, -76), (-22, -56)], 'armR': [(18, -96), (25, -76), (27, -58)], 'legL': [(-7, -56), (-8, -30), (-8, -8)], 'legR': [(7, -56), (8, -30), (8, -8)]}
    for k in ('legL', 'legR'):
        pts = [U(q(p), -0.02) for p in B[k]]
        for i in range(2): capsule('ml' + k + str(i), pts[i], pts[i + 1], 0.085, 'fixed', c, '#1f3a5f')
        ball('mshoe' + k, pts[-1] + Vector((0, -0.05, -0.04)), 0.075, 'fixed', c, '#26242c', sc=(1, 1.6, 0.75))
    torso3d('mtorso', q(B['shL']), q(B['shR']), q(B['hipL']), q(B['hipR']), 'fixed', c, '#2e8b57')
    for yy in (-84, -70):
        torso3d('stripe', q((-16.5, yy)), q((16.5, yy)), q((-16, yy + 5)), q((16, yy + 5)), 'fixed', c, '#f4d03f', depth=0.255)
    for k in ('armL', 'armR'):
        pts = [U(q(p), -0.1) for p in B[k]]
        capsule('ma' + k + '0', pts[0], pts[1], 0.068, 'fixed', c, '#2e8b57'); capsule('ma' + k + '1', pts[1], pts[2], 0.062, 'fixed', c, '#2e8b57')
        ball('mhand' + k, pts[2], 0.065, 'skin', c)
    bag = box('bag', U(q((31, -54)))[0], D0 - 0.16, U(q((31, -54)))[2] - 0.1, 0.26, 0.12, 0.19, '#d63031', c); tag(bag, 'fixed', '#d63031')
    wx = U(q((31, -54))); w1 = box('bx', wx.x, D0 - 0.23, wx.z - 0.06, 0.05, 0.01, 0.12, '#ffffff', c); tag(w1, 'fixed', '#ffffff'); w2 = box('by', wx.x, D0 - 0.23, wx.z - 0.025, 0.12, 0.01, 0.05, '#ffffff', c); tag(w2, 'fixed', '#ffffff')
    hc, up, side, r = headset({'head': q(B['head']), 'neck': q(B['neck'])}, c, 16, hats=('hairS',))
    ball('cap_dome', hc + up * (r * 0.35) + Vector((0, r * 0.1, 0)), r * 1.06, 'hatCap', c, sc=(1, 1, 0.78))
    br = box('cap_brim', hc.x, hc.y - r * 0.85, hc.z + r * 0.38, r * 1.5, r * 1.1, r * 0.14, '#ffffff', c); tag(br, 'hatCap')
    ball('beanie', hc + up * (r * 0.38), r * 1.1, 'hatBeanie', c, sc=(1, 1, 0.92)); ball('pom', hc + up * (r * 1.38), r * 0.26, 'hatBeanie', c)
    return c

def charlights():
    lights(False); sc = bpy.context.scene; w = sc.world; bgn = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bgn.inputs['Color'].default_value = (1, 1, 1, 1); bgn.inputs['Strength'].default_value = 0.45
    so = bpy.data.objects['TWL_sun']; so.data.energy = 2.0; so.data.angle = math.radians(20); so.rotation_euler = (math.radians(40), math.radians(-30), math.radians(15))
def lum(path):
    im = bpy.data.images.load(path, check_existing=False); px = im.pixels[:]; vals = [px[i] for i in range(0, len(px), 4) if px[i + 3] > 0.9]
    bpy.data.images.remove(im); vals.sort(); n = len(vals); return (round(vals[n // 10], 2), round(vals[n // 2], 2), round(vals[-1], 2), n)

# ================= KayKit (CC0, Kay Lousberg) – vienots pasaules stils (CLAUDE.md) =================
# Šie pārraksta iepriekšējās funkcijas: koki, mājas, mašīnas, lampas, luksofori, soliņi, tālā pilsēta un virtuve – no KayKit modeļiem.
# Kamera, kontūras un gaisma paliek tās pašas (tēli/rekvizīti spēlē sakrīt ar foniem).
KC = '/Users/rihardsberzins/Documents/Tclaude/tw-modeli/28-kaykit-city-builder/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/'
KF = '/Users/rihardsberzins/Documents/Tclaude/tw-modeli/29-kaykit-forest/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/'
KR = '/Users/rihardsberzins/Documents/Tclaude/tw-modeli/30-kaykit-restaurant/KayKit_Restaurant_Bits_1.0_FREE/Assets/gltf/'
KU = '/Users/rihardsberzins/Documents/Tclaude/tw-modeli/31-kaykit-furniture/KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/'
KMAP = {'roads/light-square.glb': KC + 'streetlight.gltf', 'roads/traffic-light.glb': KC + 'trafficlight_B.gltf',
        'cars/sedan.glb': KC + 'car_sedan.gltf', 'cars/taxi.glb': KC + 'car_taxi.gltf', 'cars/suv.glb': KC + 'car_stationwagon.gltf', 'cars/van.glb': KC + 'car_hatchback.gltf'}
KB = {'A': (1.207, 1.45, 1.55), 'B': (1.607, 1.3, 1.55), 'C': (1.207, 1.3, 2.25), 'D': (1.607, 1.3, 2.25), 'E': (2.007, 1.45, 2.25), 'F': (2.007, 1.3, 2.25), 'G': (2.007, 1.45, 2.25), 'H': (2.007, 1.3, 2.95)}
_place0 = place
def src(rel):
    path = KMAP.get(rel, rel); key = path
    if key in _SRC and _alive(_SRC[key]): return _SRC[key]
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path if path.startswith('/') else MD + path)
    objs = [o for o in bpy.data.objects if o not in before]
    lib = coll('TW_LIB')
    for o in objs:
        for cc in list(o.users_collection): cc.objects.unlink(o)
        lib.objects.link(o)
    bpy.context.view_layer.layer_collection.children['TW_LIB'].exclude = True
    _SRC[key] = objs; return objs
def place(rel, x, y, z=0.0, rot=0.0, height=None, length=None, c=None):
    return _place0(KMAP.get(rel, rel), x, y, z, rot, height, length, c)
def ntree(rel, x, y, z=0.0, rot=0.0, height=6.0, c=None):
    rr = random.Random(int(x * 100 + y * 37))
    name = 'Tree_4_A_Color1' if ('pine' in rel or 'fir' in rel) else rr.choice(['Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_2_A_Color1', 'Tree_1_A_Color1'])
    return place(KF + name + '.gltf', x, y, z, rot, height=height, c=c)
def bush(x, y, c, h=0.9, rnd=None):
    k = (rnd or random).choice(['Bush_1_A_Color1', 'Bush_2_A_Color1', 'Bush_1_C_Color1']); return place(KF + k + '.gltf', x, y, 0, (rnd or random).random() * 6, height=h, c=c)
def hedge(x, y, sx, sy, c, h=0.9):
    n = max(1, int(max(sx, sy) / 1.1)); rr = random.Random(int(x * 7 + y * 13))
    for i in range(n):
        t = (i + 0.5) / n - 0.5; bush(x + (sx * t if sx >= sy else 0), y + (sy * t if sy > sx else 0), c, h * rr.uniform(0.9, 1.25), rr)
def bench3d(x, y, rot, c): return place(KC + 'bench.gltf', x, y, 0, rot, length=1.8, c=c)
def kbuilding(k, x0, side, y0, L, c):
    # fasāde x=x0, māja uz side pusi; priekša (−Y modelī) pret ielu
    mw, md, mh = KB[k]; s = L / mw; cx = x0 + side * md * s / 2
    return place(KC + 'building_' + k + '_withoutBase.gltf', cx, y0 + L / 2, 0, (-math.pi / 2 if side > 0 else math.pi / 2), length=max(mw, md) * s, c=c)
def building(x0, side, y0, y1, H, col, aw, c, rnd, night=False):
    k = rnd.choice(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']); kbuilding(k, x0, side, y0, y1 - y0, c)
    if night:  # daži logi naktī deg (gaismas plāksnītes uz fasādes)
        mw, md, mh = KB[k]; s = (y1 - y0) / mw; H = mh * s; fl = 3.6
        while fl < H - 2.0:
            for i in range(max(2, int((y1 - y0) / 3.2))):
                if rnd.random() < 0.45: box('lit', x0 - side * 0.06, y0 + (i + 0.5) * (y1 - y0) / max(2, int((y1 - y0) / 3.2)), fl, 0.05, 1.0, 1.3, rnd.choice(['#ffd36a', '#ffc27a', '#9ae6ff']), c, emit=2.5)
            fl += H / 4.5
def cityfar(c, rnd, y0=150, n=44, cols=None):
    for i in range(n):
        x = -160 + i * 7.5 + rnd.uniform(-2, 2); k = rnd.choice(list(KB)); mw, md, mh = KB[k]; s = rnd.uniform(4, 7)
        place(KC + 'building_' + k + '_withoutBase.gltf', x, y0 + rnd.uniform(0, 30), 0, 0, length=max(mw, md) * s, c=c)
_build_street0 = build_street
def build_street(night=False):
    c = _build_street0(night); rnd = random.Random(21)
    for y in (13, 29, 47): place(KC + 'firehydrant.gltf', 4.7, y, 0, 0, height=0.8, c=c)
    for y in (20, 42): place(KC + 'trash_A.gltf', -4.7, y, 0, 0, height=0.9, c=c)
    return c
_build_park0 = build_park
def build_park(night=False):
    c = _build_park0(night); rnd = random.Random(31)
    for i in range(10):
        x, y = rnd.uniform(-14, 14), rnd.uniform(9, 30)
        if abs(x) > 3.5: bush(x, y, c, rnd.uniform(0.6, 1.1), rnd)
    for x, y in ((-11, 26), (13, 28)): place(KF + 'Rock_1_A_Color1.gltf', x, y, 0, rnd.random() * 6, height=0.9, c=c)
    return c
_build_playground0 = build_playground
def build_playground(night=False):
    c = _build_playground0(night); rnd = random.Random(41)
    for x, y in ((-15, 12), (14, 18), (12, 26), (-17, 28)): bush(x, y, c, rnd.uniform(0.7, 1.1), rnd)
    return c
def nightlamps(names=('P_light-square', 'P_streetlight'), energy=700):
    for o in [o for o in bpy.data.objects if o.name.startswith(names)]:
        ld = bpy.data.lights.new('TWL_p', 'POINT'); ld.energy = energy; ld.color = (1.0, 0.8, 0.55); ld.shadow_soft_size = 0.6
        lo = bpy.data.objects.new('TWL_p', ld); bpy.context.scene.collection.objects.link(lo); lo.location = (o.location.x * 0.8, o.location.y, 4.6)
def build_kitchen(night=False):
    clear(); c = coll('TW_SCENE'); rnd = random.Random(17)
    W0, W1, BY, HC, s = -4.2, 4.2, 9.0, 2.9, 0.72
    for i in range(-6, 6):
        for j in range(0, 14):
            box('t', i * 0.7 + 0.35, j * 0.7 + 0.35, -0.02, 0.7, 0.7, 0.02, '#c9a77c' if (i + j) % 2 else '#b8936a', c)
    box('wl', W0 - 0.1, 4, 0, 0.2, 14, HC, '#efe2cf', c); box('wr', W1 + 0.1, 4, 0, 0.2, 14, HC, '#e8dac6', c); box('wb', 0, BY + 0.1, 0, 9, 0.2, HC, '#f3e6d3', c)
    box('ceil', 0, 4, HC, 9, 14, 0.1, '#fbf5ea', c)
    box('win', 0.3, BY - 0.02, 1.25, 1.8, 0.06, 1.1, '#2c3160' if night else '#9fd2f5', c, emit=(0 if night else 0.6)); box('winf', 0.3, BY, 1.18, 2.0, 0.05, 1.24, '#ffffff', c)
    box('wcross', 0.3, BY - 0.06, 1.25, 0.06, 0.04, 1.1, '#ffffff', c)
    # KayKit virtuve (Restaurant Bits): skapīši ar virsmu gar aizmugurējo sienu, izlietne, plīts, augšējie skapīši (ne virs loga), ledusskapis pie kreisās sienas
    cy = BY - 1.02 * s
    for x, k in ((-2.8, 'kitchencounter_sink_backsplash'), (-1.36, 'kitchencounter_straight_A_backsplash'), (0.08, 'kitchencounter_straight_A_backsplash'), (1.52, 'kitchencounter_straight_A_backsplash'), (2.96, 'kitchencounter_straight_A_backsplash')):
        place(KR + k + '.gltf', x, cy, 0, 0, length=2.04 * s, c=c)
    place(KR + 'stove_multi_countertop.gltf', -1.36, cy, 0.93 * s, 0, length=1.74 * s, c=c)
    for x in (-2.8, -1.36, 2.96): place(KR + 'kitchencabinet.gltf', x, BY - 0.52 * s, 2.0 * s, 0, length=2.04 * s, c=c)
    place(KR + 'fridge_A.gltf', W0 + 1.12 * s, 6.5, 0, math.pi / 2, length=2.24 * s, c=c)
    # galds labajā pusē (uz tā tējas krūze – rekvizīts tiek zīmēts spēlē) + krēsli
    place(KU + 'table_medium.gltf', 1.6, 5.5, 0, 0, height=0.72, c=c)
    place(KU + 'chair_A_wood.gltf', 2.55, 5.5, 0, -math.pi / 2, height=0.9, c=c); place(KU + 'chair_A_wood.gltf', 0.65, 5.5, 0, math.pi / 2, height=0.9, c=c)
    place(KU + 'cactus_small_A.gltf', 2.96, cy, 1.0 * s, 0, height=0.25, c=c)
    cyl('lamp', 0, 5, 2.3, 0.35, 0.25, '#ffd98a' if night else '#f4f1e4', c, 16, emit=(4 if night else 0))
    if night:
        ld = bpy.data.lights.new('TWL_k', 'POINT'); ld.energy = 250; ld.color = (1, 0.85, 0.6); lo = bpy.data.objects.new('TWL_k', ld); c.objects.link(lo); lo.location = (0, 5, 2.2)
    else:
        ld = bpy.data.lights.new('TWL_k', 'AREA'); ld.energy = 400; ld.size = 2; lo = bpy.data.objects.new('TWL_k', ld); c.objects.link(lo); lo.location = (0.3, BY - 1.0, 1.6); lo.rotation_euler = (math.radians(-90), 0, 0)
    return c
