# Skola – klases fons (Blender 5.x, EEVEE + Freestyle kontūras). Strādā tikai scēnā SKOLA_BG.
# Palaišana: exec(open(ceļš).read()); all_refs()  → skola/bg/<ref>.png (pēc tam → webp q90) + izdrukā REFS datus game.js.
# Telpu būvē pēc spēles layout() (hy, fy, wx0, wx1, top) atsauces izmērā; kadrs ir EXT reizes lielāks (rezerve malām),
# lai spēle var to vienmērīgi mērogot pēc aizmugurējās sienas platuma un piesiet pie grīdas līnijas fy.
# Logu stikls – caurspīdīgs (Holdout): aiz tā spēle zīmē debesis ar mākoņiem un putniem.
# Mēbeles un augi – KayKit Furniture Bits; aiz logiem – KayKit Forest koki un City Builder mājas (CC0, Kay Lousberg).
# Logu ailēs sienā ir īsti caurumi; debesis caurspīdīgas – tās (ar mākoņiem/putniem) zīmē spēle.
import bpy, bmesh, math
from mathutils import Vector, Matrix
SC = bpy.data.scenes.get('SKOLA_BG') or bpy.data.scenes.new('SKOLA_BG')
bpy.context.window.scene = SC
OUT = '/Users/rihardsberzins/Documents/Tclaude/tailers-world/skola/bg/'
TM = '/Users/rihardsberzins/Documents/Tclaude/tw-modeli/'
KF = TM + '31-kaykit-furniture/KayKit_Furniture_Bits_1.0_FREE/Assets/gltf/'
KC = TM + '28-kaykit-city-builder/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/'
KN = TM + '29-kaykit-forest/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/'
EXT = 1.4  # kadrs pret atsauces ekrānu (0.2 rezerve katrā pusē)
# atsauces ekrāni (CSS px) un to layout() – izvēlas pēc aizmugurējās sienas proporcijas
REFS = {
    'p':  (390, 780,  {"hy": 167.69, "fy": 279.2, "wx0": 27.3, "wx1": 362.7, "top": 49.13}, 2.4),
    'pt': (768, 1024, {"hy": 188.55, "fy": 325.56, "wx0": 53.76, "wx1": 714.24, "top": 32.9}, 2.2),
    'lt': (1024, 768, {"hy": 177.5, "fy": 287, "wx0": 155.28, "wx1": 868.72, "top": 41.5}, 2.2),
    'l':  (780, 390,  {"hy": 135.375, "fy": 205, "wx0": 101.6, "wx1": 678.4, "top": 57.375}, 2.4),
}

def hexc(h, a=1.0):
    h = h.lstrip('#'); r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    f = lambda c: c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
    return (f(r), f(g), f(b), a)
_M = {}
def mat(h, emit=0.0):
    key = (h, emit)
    if key in _M and _M[key].name in bpy.data.materials: return _M[key]
    m = bpy.data.materials.new('sk_' + h.strip('#')); m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs['Base Color'].default_value = hexc(h); b.inputs['Roughness'].default_value = 0.8
    if emit: b.inputs['Emission Color'].default_value = hexc(h); b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = hexc(h); _M[key] = m; return m
def holdout():
    m = bpy.data.materials.get('sk_glass')
    if m: return m
    m = bpy.data.materials.new('sk_glass'); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes):
        if n.type != 'OUTPUT_MATERIAL': nt.nodes.remove(n)
    out = next(n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'); h = nt.nodes.new('ShaderNodeHoldout')
    nt.links.new(h.outputs[0], out.inputs['Surface']); return m
def coll(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in SC.collection.children: SC.collection.children.link(c)
    return c
def _obj(name, me, loc, color, c, emit=0.0):
    o = bpy.data.objects.new(name, me); o.location = loc; (c or coll('SKB_ROOM')).objects.link(o)
    o.data.materials.append(holdout() if color == 'GLASS' else mat(color, emit)); return o
def box(name, x, y, z, sx, sy, sz, color, c=None, emit=0.0, bev=0.0):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x*sx, v.co.y*sy, v.co.z*sz + sz/2))
    bm.to_mesh(me); bm.free(); o = _obj(name, me, (x, y, z), color, c, emit)
    if bev: md = o.modifiers.new('bev', 'BEVEL'); md.width = bev; md.segments = 2
    return o
def sphere(name, x, y, z, r, color, c=None):
    me = bpy.data.meshes.new(name); bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
    bm.to_mesh(me); bm.free(); return _obj(name, me, (x, y, z), color, c)
def kk(path, x, y, rot=0.0, h=None, w=None, z=0.0, c=None):
    """KayKit modelis (ar saviem tekstūras materiāliem): pamats uz z, mērogo līdz augstumam h (vai platumam w)."""
    c = c or coll('SKB_ROOM'); before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path + '.gltf')
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for cc in list(o.users_collection): cc.objects.unlink(o)
        c.objects.link(o)
    roots = [o for o in new if o.parent is None]
    def bbox():
        bpy.context.view_layer.update()
        pts = [o.matrix_world @ Vector(b) for o in new if o.type == 'MESH' for b in o.bound_box]
        return Vector([min(p[i] for p in pts) for i in range(3)]), Vector([max(p[i] for p in pts) for i in range(3)])
    mn, mx = bbox(); f = h / (mx.z - mn.z) if h else w / max(mx.x - mn.x, mx.y - mn.y)
    piv = Vector(((mn.x + mx.x)/2, (mn.y + mx.y)/2, mn.z))
    M = Matrix.Translation(Vector((x, y, z))) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(f, 4) @ Matrix.Translation(-piv)
    for o in roots: o.matrix_world = M @ o.matrix_world
    mn, mx = bbox()  # pagrieziens maina bbox centru – piesien vēlreiz
    for o in roots: o.matrix_world = Matrix.Translation(Vector((x - (mn.x + mx.x)/2, y - (mn.y + mx.y)/2, z - mn.z))) @ o.matrix_world
    return new

def outside(hw):
    """Skats aiz logiem: zāle, ietve, koki (KayKit Forest) un pilsētas mājas (KayKit City), debesis caurspīdīgas."""
    o = nl = coll('SKB_NOLINE')  # bez kontūrām (aiz loga – vienkāršāk, mierīgāk)
    box('grass', -hw - 150, 60, -0.02, 300, 400, 0.02, '#86c96b', nl)
    box('walk', -hw - 3.2, 60, 0.0, 1.6, 400, 0.02, '#d8d2c4', nl)
    box('road', -hw - 30, 60, 0.0, 6, 400, 0.02, '#6d6f78', nl)
    trees = ['Tree_1_A_Color1', 'Tree_2_A_Color1', 'Tree_3_A_Color1', 'Tree_4_A_Color1', 'Tree_1_B_Color1', 'Tree_2_B_Color1']
    for i, y in enumerate((-6.0, 6.0, 18.0, 30.0, 42.0, 54.0)):  # koku rinda – ar atstarpēm, lai starp vainagiem redz debesis
        kk(KN + trees[i % len(trees)], -hw - 16 - (i % 2)*4, y, rot=i*1.1, h=4.0 + (i % 3)*0.7, c=o)
    for i, y in enumerate((0.0, 6.0, 12.0)):
        kk(KN + ['Bush_1_A_Color1', 'Bush_2_A_Color1', 'Bush_3_A_Color1'][i], -hw - 2.4, y + 1.5, h=0.8, c=o)
    blds = ['building_A', 'building_C', 'building_E', 'building_B', 'building_G', 'building_D', 'building_H']
    for i, y in enumerate((-40.0, -10.0, 20.0, 50.0, 80.0, 110.0, 140.0)):  # tāla pilsētas siluets pie apvāršņa
        kk(KC + blds[i], -hw - 110 - (i % 2)*10, y, rot=-math.pi/2, h=12 + (i % 3)*4, w=None, c=o)

def wipe():
    for c in list(SC.collection.children):
        if c.name.startswith('SKB_') and c.name != 'SKB_LIGHT':
            for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.collections.remove(c)

RH = 3.6; D = 9.0
WIN = (1.0, 3.6, 6.2)
def room(L):
    p = (L['fy'] - L['top']) / RH; RW = (L['wx1'] - L['wx0']) / p; camh = (L['fy'] - L['hy']) / p
    c = coll('SKB_ROOM'); nl = coll('SKB_NOLINE'); hw = RW/2
    box('floor', 0, D/2 - 2, -0.05, RW + 0.2, D + 5, 0.05, '#a8723f', c)
    for i in range(-40, 41):  # parketa dēļi – joslas ar nedaudz atšķirīgu toni, bez kontūrām
        if abs(i*0.24) < hw + 0.2:
            for k in range(8):
                L0 = 1.2 + ((i*0.37 + k*0.61) % 0.9); y0 = -6 + k*2.2 + ((i*0.53) % 1.1)
                box(f'pl{i}_{k}', i*0.24, y0 + L0/2, 0.0, 0.232, min(L0 + 1.0, 2.15), 0.004, ['#a8723f', '#9d6a3a', '#b07a45', '#a06c3c'][(i + k*3) % 4], nl)
    box('back', 0, D + 0.05, 0, RW + 0.2, 0.1, RH, '#f7e8c8', c)
    box('right', hw + 0.05, D/2 - 2, 0, 0.1, D + 5, RH + 0.1, '#f5dfb5', c)
    # kreisā siena ar logu ailēm (stikla laukums y0+0.08…y0+1.82, z 1.08…2.92)
    LW, LC, y_a, y_b = 0.1, '#f1d9ad', -4.5, D + 0.5
    box('leftLo', -hw - 0.05, (y_a + y_b)/2, 0, LW, y_b - y_a, 1.08, LC, c)
    box('leftHi', -hw - 0.05, (y_a + y_b)/2, 2.92, LW, y_b - y_a, RH + 0.1 - 2.92, LC, c)
    edges = [y_a] + [e for y0 in WIN for e in (y0 + 0.08, y0 + 1.82)] + [y_b]
    for i in range(0, len(edges), 2):
        box(f'leftP{i}', -hw - 0.05, (edges[i] + edges[i+1])/2, 1.08, LW, edges[i+1] - edges[i], 1.84, LC, c)
    outside(hw)
    box('bPanel', 0, D - 0.01, 0, RW, 0.04, 0.9, '#86b9ae', c); box('bRail', 0, D - 0.04, 0.9, RW, 0.06, 0.05, '#5f9087', c)
    for nm, x in (('lPanel', -hw + 0.01), ('rPanel', hw - 0.01)):
        box(nm, x, D/2 - 2, 0, 0.04, D + 5, 0.9, '#86b9ae', c); box(nm + 'R', x + (0.02 if x < 0 else -0.02), D/2 - 2, 0.9, 0.06, D + 5, 0.05, '#5f9087', c)
    box('skirt', 0, D - 0.03, 0, RW, 0.05, 0.08, '#5a3b22', c)
    box('ceil', 0, D/2 - 2, RH, RW + 0.2, D + 5, 0.1, '#fff8ec', c)
    for x in ([-hw*0.45, hw*0.45] if RW > 8 else [0]):
        for y in (3.0, 6.5): box(f'lamp{x:.1f}_{y}', x, y, RH - 0.06, 1.3, 0.3, 0.05, '#ffffff', c, emit=2.5)
    # logi kreisajā sienā – stikls caurspīdīgs (debesis zīmē spēle)
    for y0 in WIN:
        for nm, yy, sy, zz, sz in (('L', y0 + 0.04, 0.08, 1.0, 2.0), ('R', y0 + 1.86, 0.08, 1.0, 2.0), ('B', y0 + 0.95, 1.9, 1.0, 0.08), ('T', y0 + 0.95, 1.9, 2.92, 0.08)):
            box(f'winF{nm}{y0}', -hw + 0.02, yy, zz, 0.14, sy, sz, '#ffffff', c)  # rāmis ap aili
        box(f'winM{y0}', -hw + 0.09, y0 + 0.95, 1.08, 0.05, 0.06, 1.84, '#ffffff', c)
        box(f'winT{y0}', -hw + 0.09, y0 + 0.95, 2.35, 0.05, 1.74, 0.05, '#ffffff', c)
        box(f'sill{y0}', -hw + 0.14, y0 + 0.95, 0.95, 0.26, 2.0, 0.06, '#ffffff', c, bev=0.01)
        kk(KF + ['cactus_small_A', 'cactus_small_B', 'cactus_medium_A'][WIN.index(y0)], -hw + 0.16, y0 + 0.5, h=0.34 + 0.1*(WIN.index(y0) == 2), z=1.01)
    # durvis, skapītis un lampa labajā sienā
    box('doorF', hw - 0.02, 1.9, 0, 0.06, 1.25, 2.3, '#8a5a32', c)
    box('door', hw - 0.05, 1.9, 0, 0.06, 1.1, 2.2, '#c88a4c', c, bev=0.02)
    box('doorWin', hw - 0.09, 1.9, 1.35, 0.02, 0.45, 0.6, '#c7ebff', c)
    sphere('knob', hw - 0.11, 1.5, 1.05, 0.05, '#f2c23a', c)
    kk(KF + 'cabinet_small_decorated', hw - 0.3, 3.05, rot=-math.pi/2, w=0.85)
    kk(KF + 'lamp_standing', hw - 0.3, 3.85, h=1.7)
    # skapis ar grāmatām, sienas plaukti un gleznas labajā sienā, kaktusi priekšējos stūros
    kk(KF + 'cabinet_medium_decorated', hw - 0.42, 5.7, rot=-math.pi/2, w=1.7)
    kk(KF + 'shelf_B_large_decorated', hw - 0.16, 5.7, rot=-math.pi/2, w=1.6, z=1.75)
    kk(KF + 'shelf_B_small_decorated', hw - 0.16, 6.95, rot=-math.pi/2, w=0.8, z=1.2)
    kk(KF + 'cactus_medium_B', -hw + 0.45, 0.6, h=1.0); kk(KF + 'cactus_medium_A', hw - 0.45, 0.6, h=0.95, rot=1.3)
    for i, (y, col) in enumerate([(7.9, '#ffcf5c'), (4.5, '#7fd0ff')]):  # krāsaini plakāti (KayKit rāmji ir tukši)
        box(f'postR{i}', hw - 0.03, y, 1.35, 0.02, 0.9, 1.1, col, c)
        for k, cc in enumerate(['#ff6b6b', '#4c8dff', '#4cd97b']):
            box(f'postR{i}{k}', hw - 0.05, y - 0.25 + k*0.25, 1.75 - (k % 2)*0.25, 0.02, 0.18, 0.18, cc, c)
    # bērnu zīmējumi virs logiem
    for i in range(7):
        box(f'art{i}', -hw + 0.04, 0.8 + i*1.15, 3.0, 0.02, 0.5, 0.4, ['#fff3c4', '#ffd8e6', '#d8f0ff', '#e2ffd8'][i % 4], c)
        sphere(f'artS{i}', -hw + 0.03, 0.8 + i*1.15, 3.42, 0.05, ['#ff6b6b', '#4c8dff', '#ffd34d'][i % 3], c)
    return p, RW, camh

def camera(Wr, Hr, L, p, camh, k):
    cam = bpy.data.objects.get('SKB_Cam')
    if not cam: cam = bpy.data.objects.new('SKB_Cam', bpy.data.cameras.new('SKB_Cam')); SC.collection.objects.link(cam)
    SC.camera = cam; cam.location = (0, 0, camh); cam.rotation_euler = (math.pi/2, 0, 0)
    Wx, Hx = Wr * EXT, Hr * EXT; f_px = p * D
    cam.data.sensor_fit = 'VERTICAL' if Hx > Wx else 'HORIZONTAL'
    cam.data.sensor_width = 36; cam.data.sensor_height = 36 * Hx / Wx; cam.data.lens = f_px / Wx * 36
    cam.data.shift_x = 0; cam.data.shift_y = -(Hr/2 - L['hy']) / max(Wx, Hx)
    cam.data.clip_start = 0.05; cam.data.clip_end = 400
    SC.render.resolution_x, SC.render.resolution_y = round(Wx * k), round(Hx * k)
    SC.render.line_thickness = 1.0 * k  # ~1 CSS px kontūra jebkurā izšķirtspējā
    return cam

def look():
    try: SC.render.engine = 'BLENDER_EEVEE'
    except TypeError: SC.render.engine = 'BLENDER_EEVEE_NEXT'
    w = bpy.data.worlds.get('SKB_World') or bpy.data.worlds.new('SKB_World'); SC.world = w; w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND'); bg.inputs[0].default_value = (1, .97, .92, 1); bg.inputs[1].default_value = 0.6
    lc = coll('SKB_LIGHT')
    s = bpy.data.objects.get('SKB_Sun') or bpy.data.objects.new('SKB_Sun', bpy.data.lights.new('SKB_Sun', 'SUN'))
    if s.name not in lc.objects: lc.objects.link(s)
    s.data.energy = 2.4; s.rotation_euler = (math.radians(50), math.radians(-30), math.radians(-60)); s.data.color = (1, .94, .82)
    a = bpy.data.objects.get('SKB_Fill') or bpy.data.objects.new('SKB_Fill', bpy.data.lights.new('SKB_Fill', 'AREA'))
    if a.name not in lc.objects: lc.objects.link(a)
    a.data.energy = 250; a.data.size = 5; a.location = (0, 3, 3.4)
    SC.view_settings.view_transform = 'Standard'; SC.view_settings.look = 'None'
    SC.render.use_freestyle = True; SC.render.line_thickness_mode = 'ABSOLUTE'; SC.render.line_thickness = 1.6
    vl = SC.view_layers[0]; vl.use_freestyle = True; fs = vl.freestyle_settings
    if not fs.linesets: fs.linesets.new('L')
    l = fs.linesets[0]; l.linestyle.color = (.13, .09, .11); l.select_by_visibility = True
    l.select_by_collection = True; l.collection = coll('SKB_NOLINE'); l.collection_negation = 'EXCLUSIVE'
    SC.render.film_transparent = True
    try: SC.eevee.taa_render_samples = 128  # bez graudiem mīkstajās ēnās
    except AttributeError: pass
    SC.render.image_settings.file_format = 'PNG'; SC.render.image_settings.color_mode = 'RGBA'

def win_boxes(cam, Wr, Hr, RW):
    """Logu stikla taisnstūri atsauces ekrāna px: [x0, y0, x1, y1] (spēle aiz tiem zīmē debesis)."""
    from bpy_extras.object_utils import world_to_camera_view
    Wx, Hx = Wr * EXT, Hr * EXT; out = []; hw = RW/2
    for y0 in WIN:
        pts = []
        for yy in (y0 + 0.08, y0 + 1.82):
            for zz in (1.08, 2.92):
                v = world_to_camera_view(SC, cam, Vector((-hw + 0.06, yy, zz)))
                pts.append((v.x*Wx - (Wx - Wr)/2, (1 - v.y)*Hx - (Hx - Hr)/2, v.z))
        if min(p[2] for p in pts) <= 0: continue
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        if max(xs) < -0.3*Wr: continue
        out.append([round(min(xs), 1), round(min(ys), 1), round(max(xs), 1), round(max(ys), 1)])
    return out

def all_refs(only=None):
    look(); res = {}
    for key, (Wr, Hr, L, k) in REFS.items():
        if only and key not in only: continue
        wipe(); p, RW, camh = room(L); cam = camera(Wr, Hr, L, p, camh, k)
        SC.view_layers[0].freestyle_settings.linesets[0].collection = coll('SKB_NOLINE')
        SC.render.filepath = OUT + key + '.png'; bpy.ops.render.render(write_still=True, scene=SC.name)
        res[key] = dict(w=Wr, h=Hr, fy=L['fy'], ww=round(L['wx1'] - L['wx0'], 2), wh=round(L['fy'] - L['top'], 2), win=win_boxes(cam, Wr, Hr, RW))
    print(res); return res
